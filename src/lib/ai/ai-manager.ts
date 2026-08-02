import { AiFactory, ProviderConfigError } from "@/lib/ai/factory/ai-factory";
import {
  AiProviderError,
  type ChatMessage,
  type ChatResult,
} from "@/lib/ai/interfaces/ai-strategy.interface";
import { disabledRejectedCode } from "@/lib/providers/disabled-reason";
import { prisma } from "@/lib/prisma";

/** Batas waktu satu provider sebelum dianggap gagal dan dilewati. */
const PROVIDER_TIMEOUT_MS = 45_000;

/** Batas jumlah kunci yang diambil dari database untuk satu request. */
const MAX_KEYS = 6;

/**
 * Batas total percobaan (kunci × model) dalam satu request.
 * Menjaga latensi tetap terkendali meski tiap kunci punya banyak model cadangan.
 */
const MAX_ATTEMPTS = 10;

export interface ProcessChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Batasi ke satu provider tertentu, mis. "groq". */
  provider?: string;
  /** Untuk pencatatan kuota harian; null pada endpoint demo. */
  apiKeyId?: string | null;
  /**
   * Pemilik request. Menentukan kunci mana yang boleh dipakai:
   * kunci miliknya sendiri lebih dulu, lalu Provider Publik.
   * Null (demo halaman depan) hanya boleh memakai Provider Publik.
   */
  userId?: string | null;
  source?: "api" | "demo";
}

export interface AttemptFailure {
  provider: string;
  model: string | null;
  status: number | null;
  message: string;
  /** Kegagalan ini mematikan seluruh kunci, bukan hanya model yang dipakai. */
  disablesKey?: boolean;
}

export interface ProcessChatResult extends ChatResult {
  attempts: number;
  latencyMs: number;
  /** Provider yang sempat gagal sebelum akhirnya berhasil. */
  failures: AttemptFailure[];
}

/** Dilempar saat seluruh kunci aktif sudah dicoba dan tidak ada yang berhasil. */
export class AllProvidersFailedError extends Error {
  readonly failures: AttemptFailure[];

  constructor(message: string, failures: AttemptFailure[]) {
    super(message);
    this.name = "AllProvidersFailedError";
    this.failures = failures;
  }
}

/** Dilempar saat belum ada satu pun ProviderKey aktif di database. */
export class NoProviderAvailableError extends Error {
  constructor() {
    super(
      "Belum ada ProviderKey aktif. Tambahkan minimal satu API key provider di dashboard.",
    );
    this.name = "NoProviderAvailableError";
  }
}

/**
 * Orkestrator fallback — inti dari FreeAll AI.
 *
 * Mengambil semua kunci aktif berurutan prioritas, mencobanya satu per satu,
 * dan memperbarui status kunci di database berdasarkan jenis kegagalan:
 * 429 dihitung sebagai limit sementara, 401/403 mematikan kunci permanen.
 */
export class AiManager {
  static async processChat(
    options: ProcessChatOptions,
  ): Promise<ProcessChatResult> {
    const startedAt = Date.now();
    const source = options.source ?? "api";

    const providerKeys = await this.resolveKeys(options);

    if (providerKeys.length === 0) {
      throw new NoProviderAvailableError();
    }

    const failures: AttemptFailure[] = [];
    let attempts = 0;

    for (const providerKey of providerKeys) {
      // Kuota gratis umumnya dihitung PER MODEL, jadi model utama yang kena
      // 429 tidak berarti kuncinya habis — model lain di akun yang sama
      // sering masih punya jatah. Karena itu tiap kunci dicoba dengan
      // beberapa model sebelum pindah ke kunci berikutnya.
      const models = [providerKey.modelName, ...providerKey.fallbackModels]
        .filter((model): model is string => Boolean(model))
        .filter((model, index, all) => all.indexOf(model) === index);

      // Kunci tanpa model tersimpan tetap dicoba: Factory akan mengambil
      // default dari preset provider.
      const attemptModels = models.length > 0 ? models : [null];
      let keyDisabled = false;

      for (const model of attemptModels) {
        if (attempts >= MAX_ATTEMPTS) break;
        attempts += 1;

        try {
          const strategy = AiFactory.create({ ...providerKey, modelName: model });

          const result = await strategy.chat({
            messages: options.messages,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
          });

          await this.recordSuccess(providerKey.id, result.model);
          await this.log({
            apiKeyId: options.apiKeyId ?? null,
            providerKeyId: providerKey.id,
            providerName: result.provider,
            modelName: result.model,
            success: true,
            statusCode: 200,
            attempts,
            latencyMs: Date.now() - startedAt,
            errorMessage: null,
            source,
          });

          return {
            ...result,
            attempts,
            latencyMs: Date.now() - startedAt,
            failures,
          };
        } catch (error) {
          const failure = await this.handleFailure(
            providerKey.id,
            providerKey.providerName,
            { model, error },
          );
          failures.push(failure);

          // Kunci ditolak permanen (401/403) atau salah konfigurasi:
          // percuma mencoba model lain dengan kunci yang sama.
          if (failure.disablesKey) {
            keyDisabled = true;
            break;
          }
        }
      }

      if (attempts >= MAX_ATTEMPTS) break;
      if (keyDisabled) continue;
    }

    const latencyMs = Date.now() - startedAt;
    const lastFailure = failures.at(-1);

    await this.log({
      apiKeyId: options.apiKeyId ?? null,
      providerKeyId: null,
      providerName: lastFailure?.provider ?? null,
      modelName: lastFailure?.model ?? null,
      success: false,
      statusCode: lastFailure?.status ?? null,
      attempts,
      latencyMs,
      errorMessage: lastFailure?.message ?? "Semua provider gagal",
      source,
    });

    throw new AllProvidersFailedError(
      `Seluruh ${providerKeys.length} kunci provider yang dicoba gagal merespons.`,
      failures,
    );
  }

  /**
   * Tentukan kunci mana yang boleh dipakai request ini.
   *
   * Aturannya:
   * - Kunci milik user sendiri dicoba LEBIH DULU. Kalau seseorang membawa
   *   kuncinya sendiri, dialah yang berhak memakainya, dan kuotanya tidak
   *   ikut terkuras request orang lain.
   * - Setelah itu barulah Provider Publik (`SHARED`) — biasanya diisi admin,
   *   atau user yang sengaja menyumbangkan kuncinya.
   * - Request tanpa pemilik (demo halaman depan) HANYA boleh menyentuh
   *   Provider Publik. Tanpa aturan ini, pengunjung anonim bisa menghabiskan
   *   kunci berbayar milik user lain.
   */
  private static async resolveKeys(options: ProcessChatOptions) {
    const providerFilter = options.provider
      ? { providerName: options.provider.toLowerCase() }
      : {};

    const select = {
      id: true,
      providerName: true,
      keyCiphertext: true,
      format: true,
      baseUrl: true,
      modelName: true,
      fallbackModels: true,
    } as const;

    const orderBy = [
      { priority: "desc" as const }, // Prioritas tertinggi lebih dulu
      { errorCount: "asc" as const }, // Lalu yang paling jarang gagal
      { createdAt: "asc" as const },
    ];

    const own = options.userId
      ? await prisma.providerKey.findMany({
          where: { isActive: true, userId: options.userId, ...providerFilter },
          orderBy,
          take: MAX_KEYS,
          select,
        })
      : [];

    if (own.length >= MAX_KEYS) return own;

    const shared = await prisma.providerKey.findMany({
      where: {
        isActive: true,
        scope: "SHARED",
        ...(options.userId ? { userId: { not: options.userId } } : {}),
        ...providerFilter,
      },
      orderBy,
      take: MAX_KEYS - own.length,
      select,
    });

    return [...own, ...shared];
  }

  /**
   * Perbarui status kunci sesuai jenis kegagalan, lalu kembalikan ringkasannya.
   *
   * Memakai `updateMany` (bukan `update`) supaya tidak melempar error kalau
   * kunci kebetulan dihapus user di tengah request.
   */
  private static async handleFailure(
    providerKeyId: string,
    providerName: string,
    context: { model: string | null; error: unknown },
  ): Promise<AttemptFailure> {
    const { error } = context;

    // Salah konfigurasi (baseUrl/model kosong, ciphertext rusak) bukan salah
    // vendor — kunci dimatikan agar tidak memperlambat request berikutnya.
    if (error instanceof ProviderConfigError) {
      await prisma.providerKey.updateMany({
        where: { id: providerKeyId },
        data: {
          isActive: false,
          disabledReason: error.message,
          lastError: error.message,
          lastErrorAt: new Date(),
        },
      });
      return {
        provider: providerName,
        model: context.model,
        status: null,
        message: error.message,
        disablesKey: true,
      };
    }

    const providerError =
      error instanceof AiProviderError
        ? error
        : new AiProviderError(
            providerName,
            error instanceof Error ? error.message : "Kesalahan tidak dikenal",
            { cause: error },
          );

    const message = providerError.message.slice(0, 500);

    if (providerError.isAuthError) {
      // Kunci ditolak permanen: matikan supaya tidak dicoba lagi.
      await prisma.providerKey.updateMany({
        where: { id: providerKeyId },
        data: {
          isActive: false,
          disabledReason: disabledRejectedCode(providerError.status ?? null),
          errorCount: { increment: 1 },
          lastError: message,
          lastErrorAt: new Date(),
        },
      });
    } else {
      // 429 dan gangguan sementara: kunci tetap aktif, hanya dicatat.
      await prisma.providerKey.updateMany({
        where: { id: providerKeyId },
        data: {
          errorCount: { increment: 1 },
          lastError: message,
          lastErrorAt: new Date(),
        },
      });
    }

    return {
      provider: providerName,
      // 401/403 mematikan kunci, jadi model cadangan pada kunci yang sama
      // tidak perlu dicoba. 429 dan 404 hanya menyangkut satu model.
      disablesKey: providerError.isAuthError,
      model: context.model,
      status: providerError.status ?? null,
      message,
    };
  }

  /**
   * Catat keberhasilan, dan bila yang berhasil adalah model cadangan,
   * naikkan model itu menjadi model utama.
   *
   * Tujuannya menyembuhkan diri: kalau model utama kehabisan kuota harian,
   * request berikutnya langsung memakai model yang terbukti jalan alih-alih
   * membuang satu percobaan gagal setiap kali.
   */
  private static async recordSuccess(
    providerKeyId: string,
    usedModel: string,
  ): Promise<void> {
    const current = await prisma.providerKey.findUnique({
      where: { id: providerKeyId },
      select: { modelName: true, fallbackModels: true },
    });
    if (!current) return;

    const promote = current.modelName !== null && current.modelName !== usedModel;

    await prisma.providerKey.updateMany({
      where: { id: providerKeyId },
      data: {
        successCount: { increment: 1 },
        lastUsedAt: new Date(),
        lastError: null,
        ...(promote
          ? {
              modelName: usedModel,
              // Model utama lama tetap disimpan sebagai cadangan — kuotanya
              // biasanya pulih pada reset harian berikutnya. Duplikat dibuang
              // karena model utama lama bisa saja sudah ada di daftar cadangan,
              // dan entri kembar akan memboroskan jatah percobaan.
              fallbackModels: [
                ...new Set([current.modelName as string, ...current.fallbackModels]),
              ]
                .filter((m) => m !== usedModel)
                .slice(0, 5),
            }
          : {}),
      },
    });
  }

  /** Pencatatan tidak boleh menggagalkan request yang sudah berhasil. */
  private static async log(data: {
    apiKeyId: string | null;
    providerKeyId: string | null;
    providerName: string | null;
    modelName: string | null;
    success: boolean;
    statusCode: number | null;
    attempts: number;
    latencyMs: number;
    errorMessage: string | null;
    source: string;
  }): Promise<void> {
    try {
      await prisma.requestLog.create({ data });
    } catch (error) {
      console.error("[AiManager] gagal menulis RequestLog:", error);
    }
  }
}
