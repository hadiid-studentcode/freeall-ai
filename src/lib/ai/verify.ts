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
 * Jatah token untuk panggilan uji.
 *
 * Pernah 8, dan itu terlalu sedikit: model penalar seperti `openai/gpt-oss-20b`
 * menghabiskan seluruh jatah untuk penalaran internal lalu mengembalikan
 * `content` kosong. Kunci yang sebenarnya sehat karena itu tertolak dengan
 * pesan "Provider membalas tanpa isi pesan". Angka ini cukup untuk melewati
 * penalaran pembuka tanpa memboroskan kuota.
 */
const VERIFY_MAX_TOKENS = 96;

/** Berapa banyak model yang dicoba sebelum sebuah kunci dinyatakan gagal. */
const MAX_VERIFY_MODELS = 4;

/**
 * Uji panggilan nyata ke penyedia sebelum kunci disimpan sebagai aktif.
 *
 * Tanpa ini, salah ketik nama model atau kuota gratis yang sudah ditutup baru
 * ketahuan saat request produksi gagal — persis kelas masalah yang membuat
 * `gemini-2.0-flash` diam-diam membalas 429 (limit: 0).
 *
 * Beberapa model dicoba berurutan, bukan hanya yang teratas. Model peringkat
 * teratas bisa saja sedang habis kuotanya, ditarik penyedia, atau tidak
 * mengembalikan teks pada panggilan sesingkat ini — dan menolak seluruh kunci
 * gara-gara satu model bermasalah berarti membuang kunci yang sehat. Model
 * pertama yang berhasil dikembalikan agar dipakai sebagai model utama.
 */
export async function verifyProviderKey(
  config: {
    providerName: string;
    keyCiphertext: string;
    format: string;
    baseUrl: string | null;
  },
  models: Array<string | null>,
  t: Dictionary["errors"]["verify"],
): Promise<VerifyOutcome> {
  const candidates = models.slice(0, MAX_VERIFY_MODELS);
  let lastOutcome: VerifyOutcome | null = null;

  for (const modelName of candidates.length > 0 ? candidates : [null]) {
    let strategy;
    try {
      strategy = AiFactory.create({ ...config, modelName });
    } catch (error) {
      lastOutcome = {
        status: "rejected",
        message:
          error instanceof ProviderConfigError ? error.message : t.invalidConfig,
        httpStatus: null,
      };
      continue;
    }

    try {
      await strategy.chat({
        messages: [{ role: "user", content: "ping" }],
        maxTokens: VERIFY_MAX_TOKENS,
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      });
      return { status: "ok", model: strategy.modelName };
    } catch (error) {
      if (!(error instanceof AiProviderError)) {
        lastOutcome = {
          status: "transient",
          message: error instanceof Error ? error.message : t.unknownError,
          httpStatus: null,
        };
        continue;
      }

      // Kunci ditolak: model lain pada kunci yang sama pasti ditolak juga,
      // jadi berhenti di sini alih-alih menghabiskan waktu percuma.
      if (error.isAuthError) {
        return {
          status: "rejected",
          message: error.message,
          httpStatus: error.status ?? null,
        };
      }

      // 429, 5xx, 404, dan balasan kosong sama-sama menyangkut SATU model,
      // bukan kuncinya — semuanya alasan sah untuk mencoba model berikutnya.
      lastOutcome = {
        status: error.isRateLimit || error.isTransient ? "transient" : "rejected",
        message: error.message,
        httpStatus: error.status ?? null,
      };
    }
  }

  return (
    lastOutcome ?? {
      status: "rejected",
      message: t.invalidConfig,
      httpStatus: null,
    }
  );
}
