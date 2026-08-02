import { AiFactory, ProviderConfigError } from "@/lib/ai/factory/ai-factory";
import { AiProviderError } from "@/lib/ai/interfaces/ai-strategy.interface";
import type { Dictionary } from "@/lib/i18n";

export type VerifyOutcome =
  | { status: "ok"; model: string }
  /** Kunci/konfigurasi jelas salah — kunci sebaiknya tidak masuk kolam fallback. */
  | { status: "rejected"; message: string; httpStatus: number | null }
  /** Gangguan sementara (limit, jaringan) — kunci tetap layak dipakai nanti. */
  | { status: "transient"; message: string; httpStatus: number | null };

const VERIFY_TIMEOUT_MS = 20_000;

/**
 * Uji satu kali panggilan nyata ke penyedia sebelum kunci disimpan sebagai aktif.
 *
 * Tanpa ini, salah ketik nama model atau kuota gratis yang sudah ditutup baru
 * ketahuan saat request produksi gagal — persis kelas masalah yang membuat
 * `gemini-2.0-flash` diam-diam membalas 429 (limit: 0).
 */
export async function verifyProviderKey(
  config: {
    providerName: string;
    keyCiphertext: string;
    format: string;
    baseUrl: string | null;
    modelName: string | null;
  },
  t: Dictionary["errors"]["verify"],
): Promise<VerifyOutcome> {
  let strategy;
  try {
    strategy = AiFactory.create(config);
  } catch (error) {
    return {
      status: "rejected",
      message:
        error instanceof ProviderConfigError
          ? error.message
          : t.invalidConfig,
      httpStatus: null,
    };
  }

  try {
    await strategy.chat({
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 8,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    return { status: "ok", model: strategy.modelName };
  } catch (error) {
    if (!(error instanceof AiProviderError)) {
      return {
        status: "transient",
        message: error instanceof Error ? error.message : t.unknownError,
        httpStatus: null,
      };
    }

    // 429 dan 5xx bisa pulih sendiri; 401/403/404 berarti kunci, endpoint,
    // atau nama modelnya memang salah.
    const recoverable = error.isRateLimit || error.isTransient;
    return {
      status: recoverable ? "transient" : "rejected",
      message: error.message,
      httpStatus: error.status ?? null,
    };
  }
}
