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

/**
 * Lama istirahat sebuah model setelah kena 429, bila provider tidak memberi
 * tahu lewat header `Retry-After`.
 *
 * Angkanya sengaja sedang: kuota gratis kadang direset per menit, kadang per
 * hari, dan kita tidak bisa membedakannya dari balasan 429 saja. Istirahat
 * yang terlalu panjang membuat model terbaik menganggur padahal kuotanya sudah
 * pulih; yang terlalu pendek membuat tiap request membuang satu percobaan.
 * Lima belas menit berarti paling banyak satu percobaan sia-sia per seperempat
 * jam, dan model terbaik kembali dipakai selambat-lambatnya 15 menit setelah
 * kuotanya pulih.
 */
const DEFAULT_MODEL_COOLDOWN_MS = 15 * 60 * 1000;

/** Bentuk kolom `ProviderKey.modelCooldowns`: nama model → waktu boleh dicoba lagi. */
type ModelCooldowns = Record<string, string>;

function readCooldowns(value: unknown): ModelCooldowns {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: ModelCooldowns = {};
  for (const [model, until] of Object.entries(value as Record<string, unknown>)) {
    if (typeof until === "string") result[model] = until;
  }
  return result;
}

/** Apakah model ini masih dalam masa istirahat? */
function isResting(cooldowns: ModelCooldowns, model: string, now: number): boolean {
  const until = cooldowns[model];
  if (!until) return false;

  const at = Date.parse(until);
  return Number.isFinite(at) && at > now;
}

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

      // Urutan model SELALU mengikuti peringkat kualitas — model utama lebih
      // dulu, cadangan menyusul. Yang sedang istirahat karena 429 hanya
      // digeser ke belakang, bukan dibuang: kalau semuanya kebetulan sedang
      // istirahat, mencoba tetap lebih baik daripada langsung menyerah, sebab
      // kuota bisa saja sudah pulih lebih awal dari perkiraan.
      const cooldowns = readCooldowns(providerKey.modelCooldowns);
      const now = Date.now();
      const ready = models.filter((model) => !isResting(cooldowns, model, now));
      const resting = models.filter((model) => isResting(cooldowns, model, now));
      const ordered = [...ready, ...resting];

      // Kunci tanpa model tersimpan tetap dicoba: Factory akan mengambil
      // default dari preset provider.
      const attemptModels = ordered.length > 0 ? ordered : [null];
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
      modelCooldowns: true,
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
    } else if (providerError.isRateLimit && context.model) {
      // 429 menyangkut SATU model, bukan kuncinya. Model itu diistirahatkan
      // sampai waktu tertentu supaya request berikutnya langsung lompat ke
      // model berikutnya tanpa membuang satu percobaan — tetapi urutannya
      // tidak diubah, sehingga model terbaik kembali dipakai begitu masa
      // istirahatnya lewat.
      const restMs = providerError.retryAfterSeconds
        ? providerError.retryAfterSeconds * 1000
        : DEFAULT_MODEL_COOLDOWN_MS;

      await this.restModel(providerKeyId, context.model, restMs);

      await prisma.providerKey.updateMany({
        where: { id: providerKeyId },
        data: {
          errorCount: { increment: 1 },
          lastError: message,
          lastErrorAt: new Date(),
        },
      });
    } else {
      // Gangguan sementara lain: kunci tetap aktif, hanya dicatat.
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
   * Catat keberhasilan dan akhiri masa istirahat model yang baru saja berhasil.
   *
   * Model yang berhasil TIDAK dinaikkan jadi model utama. Dulu begitu, dan
   * akibatnya merugikan: sekali model terbaik kena 429, model cadangan yang
   * lebih lemah naik jadi utama — lalu karena model lemah itu terus berhasil,
   * model terbaik tidak pernah dicoba lagi bahkan setelah kuotanya pulih.
   * Peringkat kualitas kini yang menentukan urutan, dan kehabisan kuota hanya
   * menyingkirkan satu model untuk sementara lewat `modelCooldowns`.
   */
  private static async recordSuccess(
    providerKeyId: string,
    usedModel: string,
  ): Promise<void> {
    const current = await prisma.providerKey.findUnique({
      where: { id: providerKeyId },
      select: { modelCooldowns: true },
    });
    if (!current) return;

    // Berhasil berarti kuotanya jelas sudah pulih, jadi catatan istirahatnya
    // dihapus lebih awal daripada menunggu tenggatnya lewat.
    const cooldowns = readCooldowns(current.modelCooldowns);
    const cleared = { ...cooldowns };
    delete cleared[usedModel];

    await prisma.providerKey.updateMany({
      where: { id: providerKeyId },
      data: {
        successCount: { increment: 1 },
        lastUsedAt: new Date(),
        lastError: null,
        ...(Object.keys(cleared).length === Object.keys(cooldowns).length
          ? {}
          : { modelCooldowns: cleared }),
      },
    });
  }

  /** Istirahatkan satu model sampai waktu tertentu. */
  private static async restModel(
    providerKeyId: string,
    model: string,
    durationMs: number,
  ): Promise<void> {
    const current = await prisma.providerKey.findUnique({
      where: { id: providerKeyId },
      select: { modelCooldowns: true },
    });
    if (!current) return;

    const cooldowns = readCooldowns(current.modelCooldowns);
    const now = Date.now();

    // Catatan yang sudah kedaluwarsa ikut dibuang, supaya kolomnya tidak
    // menggelembung oleh nama model yang sudah lama tidak dipakai.
    const kept: ModelCooldowns = {};
    for (const [name, until] of Object.entries(cooldowns)) {
      if (isResting(cooldowns, name, now)) kept[name] = until;
    }
    kept[model] = new Date(now + durationMs).toISOString();

    await prisma.providerKey.updateMany({
      where: { id: providerKeyId },
      data: { modelCooldowns: kept },
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
