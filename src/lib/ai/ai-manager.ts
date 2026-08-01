import { AiFactory, ProviderConfigError } from "@/lib/ai/factory/ai-factory";
import {
  AiProviderError,
  type ChatMessage,
  type ChatResult,
} from "@/lib/ai/interfaces/ai-strategy.interface";
import { prisma } from "@/lib/prisma";

/** Batas waktu satu provider sebelum dianggap gagal dan dilewati. */
const PROVIDER_TIMEOUT_MS = 45_000;

/** Batas jumlah kunci yang dicoba dalam satu request, supaya latensi terkendali. */
const MAX_ATTEMPTS = 6;

export interface ProcessChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Batasi ke satu provider tertentu, mis. "groq". */
  provider?: string;
  /** Untuk pencatatan kuota harian; null pada endpoint demo. */
  apiKeyId?: string | null;
  source?: "api" | "demo";
}

export interface AttemptFailure {
  provider: string;
  model: string | null;
  status: number | null;
  message: string;
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

    const providerKeys = await prisma.providerKey.findMany({
      where: {
        isActive: true,
        ...(options.provider
          ? { providerName: options.provider.toLowerCase() }
          : {}),
      },
      orderBy: [
        { priority: "desc" }, // Prioritas tertinggi lebih dulu
        { errorCount: "asc" }, // Lalu yang paling jarang gagal
        { createdAt: "asc" },
      ],
      take: MAX_ATTEMPTS,
      select: {
        id: true,
        providerName: true,
        keyCiphertext: true,
        format: true,
        baseUrl: true,
        modelName: true,
      },
    });

    if (providerKeys.length === 0) {
      throw new NoProviderAvailableError();
    }

    const failures: AttemptFailure[] = [];

    for (const [index, providerKey] of providerKeys.entries()) {
      const attempts = index + 1;

      try {
        const strategy = AiFactory.create(providerKey);

        const result = await strategy.chat({
          messages: options.messages,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        });

        await this.recordSuccess(providerKey.id);
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
        failures.push(
          await this.handleFailure(providerKey.id, providerKey.providerName, {
            model: providerKey.modelName,
            error,
          }),
        );
      }
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
      attempts: providerKeys.length,
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
          disabledReason: `Ditolak provider (HTTP ${providerError.status})`,
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
      model: context.model,
      status: providerError.status ?? null,
      message,
    };
  }

  private static async recordSuccess(providerKeyId: string): Promise<void> {
    await prisma.providerKey.updateMany({
      where: { id: providerKeyId },
      data: {
        successCount: { increment: 1 },
        lastUsedAt: new Date(),
        lastError: null,
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
