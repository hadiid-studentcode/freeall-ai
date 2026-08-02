import {
  AMBIGUOUS_KEY_CANDIDATES,
  findPreset,
  PROVIDER_PRESETS,
  type ProviderFormat,
  type ProviderPreset,
} from "@/lib/ai/providers";
import type { Dictionary } from "@/lib/i18n";

/**
 * Deteksi otomatis penyedia dan pemilihan model.
 *
 * Tujuannya: user cukup menempelkan API key, sistem yang mencari tahu
 * penyedianya, endpoint-nya, dan model mana yang benar-benar hidup untuk
 * kunci itu. Nama model di preset dipakai hanya sebagai cadangan terakhir,
 * karena penyedia rutin memensiunkan model dan menutup kuota gratis.
 */

const PROBE_TIMEOUT_MS = 15_000;

export interface DiscoveredProvider {
  preset: ProviderPreset;
  /** Model yang terbukti tersedia untuk kunci ini. */
  models: string[];
}

export type DetectionResult =
  | { ok: true; provider: DiscoveredProvider }
  | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/* Daftar model per format                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Tanyakan ke penyedia model apa saja yang tersedia untuk kunci ini.
 * Mengembalikan null bila kunci ditolak atau endpoint tidak mendukung.
 */
export async function listModels(
  preset: ProviderPreset,
  apiKey: string,
  baseUrlOverride?: string,
): Promise<string[] | null> {
  const baseUrl = (baseUrlOverride || preset.baseUrl).replace(/\/+$/, "");
  if (!baseUrl) return null;

  const headers: Record<string, string> =
    preset.format === "gemini"
      ? { "x-goog-api-key": apiKey }
      : preset.format === "anthropic"
        ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
        : { Authorization: `Bearer ${apiKey}` };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/models?pageSize=500`, {
      headers,
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const payload = (await response.json().catch(() => null)) as {
    // OpenAI-compatible dan Anthropic
    data?: Array<{ id?: string }>;
    // Gemini
    models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
  } | null;

  if (!payload) return null;

  if (preset.format === "gemini") {
    return (payload.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean);
  }

  return (payload.data ?? []).map((m) => m.id ?? "").filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/* Pengujian kunci                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Apakah penyedia ini benar-benar menerima kunci tersebut?
 *
 * Mengirim permintaan chat sekecil mungkin (1 token) karena endpoint chat
 * selalu memeriksa autentikasi, sementara endpoint daftar model kadang tidak.
 * 401/403 berarti ditolak; status lain — termasuk 429 dan 400 karena nama
 * model asal-asalan — berarti kuncinya sendiri sudah melewati autentikasi.
 */
async function keyIsAccepted(
  preset: ProviderPreset,
  apiKey: string,
): Promise<boolean> {
  const baseUrl = preset.baseUrl.replace(/\/+$/, "");
  if (!baseUrl || preset.format !== "openai") return false;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: preset.defaultModel,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    return response.status !== 401 && response.status !== 403;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Deteksi penyedia dari kunci                                                */
/* -------------------------------------------------------------------------- */

/**
 * Tentukan penyedia dari sebuah API key.
 *
 * Dua tahap: cocokkan awalan kunci dulu (murah dan pasti), lalu — kalau
 * awalannya generik seperti `sk-…` yang dipakai beberapa penyedia — uji
 * endpoint daftar model tiap kandidat sampai ada yang menerima kunci itu.
 */
export async function detectProvider(
  apiKey: string,
  t: Dictionary["errors"]["discovery"],
): Promise<DetectionResult> {
  const key = apiKey.trim();
  if (!key) return { ok: false, error: t.emptyKey };

  const byPattern = PROVIDER_PRESETS.find(
    (preset) => preset.keyPattern?.test(key) ?? false,
  );

  if (byPattern) {
    const models = await listModels(byPattern, key);
    if (models === null) {
      return {
        ok: false,
        error: t.recognizedButRejected(byPattern.label),
      };
    }
    return { ok: true, provider: { preset: byPattern, models } };
  }

  // Awalan generik: coba kandidat satu per satu.
  for (const id of AMBIGUOUS_KEY_CANDIDATES) {
    const preset = findPreset(id);
    if (!preset) continue;

    // Daftar model saja tidak cukup: sebagian penyedia (mis. SambaNova)
    // melayani /models tanpa memeriksa kunci, sehingga kunci acak pun lolos.
    // Panggilan chat sungguhan selalu memaksa autentikasi.
    if (!(await keyIsAccepted(preset, key))) continue;

    const models = await listModels(preset, key);
    return { ok: true, provider: { preset, models: models ?? [] } };
  }

  return {
    ok: false,
    error: t.unknownProvider,
  };
}

/* -------------------------------------------------------------------------- */
/* Pemilihan model                                                            */
/* -------------------------------------------------------------------------- */

/** Pola model yang bukan untuk percakapan teks. */
const NON_CHAT = [
  "embed",
  "whisper",
  "tts",
  "audio",
  "speech",
  "rerank",
  "moderation",
  "guard",
  "image",
  "vision-only",
  "dall-e",
  "lyria",
  "veo",
  "imagen",
  "robotics",
  "computer-use",
  "-edit",
  "safety",
];

/**
 * Pilih model chat terbaik dari daftar yang tersedia.
 *
 * Prioritas disusun untuk gateway berbasis kunci gratisan: model bertanda
 * `:free` lebih dulu, lalu alias `-latest` yang tidak ikut usang, lalu varian
 * ringan (flash/mini/small) yang kuotanya paling longgar.
 */
export function pickBestModel(
  models: string[],
  format: ProviderFormat,
): string | null {
  return rankModels(models, format)[0] ?? null;
}

/**
 * Urutkan model chat dari yang paling layak dipakai.
 *
 * Hasil pertama dipakai sebagai model utama, sisanya disimpan sebagai model
 * cadangan pada kunci yang sama — berguna karena kuota gratis umumnya
 * dihitung per model, bukan per akun.
 */
/**
 * Keluarga model kecil/terbuka.
 *
 * Nomor generasi tidak sebanding antar keluarga: `gemma-4` bukan penerus
 * `gemini-3.6`, melainkan lini terpisah yang jauh lebih kecil. Tanpa penanda
 * ini, Gemma 4 mengungguli Gemini 3.6 hanya karena angkanya lebih besar — dan
 * pengguna dilayani model yang jelas lebih lemah.
 *
 * Model-model ini tetap layak jadi cadangan, hanya tidak boleh mendahului
 * lini utama penyedianya.
 */
const SECONDARY_FAMILIES = [
  "gemma",
  "phi",
  "smol",
  "tinyllama",
  "granite",
  "olmo",
  "ministral",
  "codegemma",
  "recurrentgemma",
];

/**
 * Nomor generasi yang tersirat pada nama model.
 *
 * Diambil dari angka pertama pada id: `gemini-3.1-pro` → 3.1,
 * `llama-3.3-70b-versatile` → 3.3, `gpt-4o-mini` → 4. Model tanpa angka
 * (mis. `gemini-flash-lite-latest`) menghasilkan 0 dan mengandalkan bobot
 * lain — terutama `latest`.
 */
function generation(id: string): number {
  // Penanggalan dibuang lebih dulu. Tanpa ini
  // `deep-research-pro-preview-12-2025` terbaca sebagai generasi 12 dan
  // melompati setiap model sungguhan — persis yang sempat terjadi.
  const cleaned = id
    .replace(/[-_]20\d{2}[-_]\d{1,2}[-_]\d{1,2}\b/g, " ")
    .replace(/[-_]\d{1,2}[-_]20\d{2}\b/g, " ")
    .replace(/[-_]20\d{6}\b/g, " ")
    .replace(/[-_]20\d{2}\b/g, " ")
    // Ukuran parameter juga bukan versi: pada `openai/gpt-oss-20b`, angka 20
    // sempat terbaca sebagai generasi 20 dan melompati setiap model lain.
    .replace(/\d+(?:\.\d+)?\s*b\b/gi, " ");

  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;

  const value = Number(match[1]);
  // Tidak ada keluarga model yang mencapai versi 20.
  return Number.isFinite(value) && value <= 20 ? value : 0;
}

/**
 * Jumlah parameter dalam miliar, bila disebut pada nama model.
 *
 * `llama-3.3-70b-versatile` → 70, `openai/gpt-oss-120b` → 120. Dipakai sebagai
 * penanda kemampuan untuk model yang tidak memakai kata seperti "pro" atau
 * "large" — tanpa ini `gpt-oss-120b` tampak sekelas model 8B.
 */
function parameterBillions(id: string): number {
  const match = id.match(/(\d+(?:\.\d+)?)\s*b\b/i);
  return match ? Number(match[1]) : 0;
}

export function rankModels(
  models: string[],
  format: ProviderFormat,
): string[] {
  const candidates = models.filter((id) => {
    const lower = id.toLowerCase();
    if (NON_CHAT.some((pattern) => lower.includes(pattern))) return false;
    if (format === "anthropic" && !lower.startsWith("claude")) return false;
    return true;
  });

  if (candidates.length === 0) return [];

  const score = (id: string): number => {
    const lower = id.toLowerCase();
    // Dipecah jadi token supaya pencocokan tidak salah sasaran: substring
    // "mini" ada di dalam "gemini", dan itu sempat membuat model pro menang
    // atas flash. Batas kata menghilangkan seluruh kelas kesalahan ini.
    const tokens = new Set(lower.split(/[^a-z0-9.]+/).filter(Boolean));
    const has = (...words: string[]) => words.some((w) => tokens.has(w));

    let value = 0;

    if (lower.endsWith(":free")) value += 100;

    /*
     * Nomor generasi jadi faktor terkuat.
     *
     * Tanpa ini skornya buta versi: `gemini-2.5-pro` dan `gemini-3.1-pro`
     * dianggap sama persis, sehingga urutan di antara keduanya ditentukan
     * kebetulan. Padahal justru itulah yang paling menentukan "model tertinggi".
     */
    value += generation(id) * 12;

    /*
     * Model paling mampu didahulukan, varian ringan jadi jaring pengaman.
     *
     * Bobotnya pernah terbalik — varian ringan menang karena kuota gratisnya
     * lebih longgar. Hasilnya: pengguna selalu dilayani model terlemah meski
     * kuota model terbaiknya masih utuh. Fallback memang ada justru untuk
     * menangani kehabisan kuota, jadi menghemat kuota di muka dengan
     * mengorbankan kualitas setiap jawaban bukan pertukaran yang sepadan.
     */
    if (has("large", "pro", "opus", "sonnet", "max", "ultra")) value += 30;

    // Ukuran parameter sebagai penanda kemampuan, untuk model yang namanya
    // tidak memakai kata tingkatan sama sekali.
    const billions = parameterBillions(id);
    if (billions >= 100) value += 40;
    else if (billions >= 30) value += 30;
    if (has("flash", "mini", "small", "lite", "instant", "haiku")) value += 10;
    if (has("instruct", "chat", "it")) value += 5;

    /*
     * Alias `latest` tidak pernah usang, tapi juga tidak mengumumkan
     * generasinya. Bobotnya sengaja sedang: cukup untuk menang atas model
     * segenerasi yang berpatok versi, tidak cukup untuk mengalahkan generasi
     * yang benar-benar lebih baru.
     */
    if (has("latest")) value += 15;

    /*
     * `preview` hanya dihukum ringan.
     *
     * Google merilis model tercanggihnya lebih dulu sebagai preview —
     * `gemini-3.1-pro-preview` dan `gemini-3-pro-preview` tidak punya padanan
     * stabil. Penalti besar membuat model terbaik justru terlempar ke dasar
     * daftar, persis kebalikan dari yang diinginkan. Yang benar-benar tidak
     * stabil (`exp`, `alpha`, `beta`) tetap dihukum berat.
     */
    if (has("preview")) value -= 5;
    if (has("exp", "experimental", "beta", "alpha")) value -= 25;
    if (has("deprecated", "legacy")) value -= 50;

    if (SECONDARY_FAMILIES.some((family) => lower.startsWith(family))) {
      value -= 40;
    }

    return value;
  };

  const sorted = [...candidates].sort((a, b) => score(b) - score(a));

  /*
   * Buang varian yang berbagi kuota dengan model yang sudah dipilih.
   *
   * `gemini-3.1-pro-preview-customtools` adalah model yang sama dengan
   * `gemini-3.1-pro-preview`, hanya beda cara pemanggilan alat — kuotanya satu
   * kolam. Menyimpannya sebagai cadangan berarti membuang satu percobaan pada
   * kuota yang sudah jelas habis.
   *
   * Yang dibuang hanya akhiran non-tingkat: `-lite`, `-mini`, dan sejenisnya
   * menandai model dengan kuota terpisah, jadi tetap dipertahankan.
   */
  const TIER_SUFFIXES = ["lite", "mini", "flash", "pro", "small", "large", "max"];
  const kept: string[] = [];

  for (const candidate of sorted) {
    const isVariant = kept.some((chosen) => {
      if (!candidate.startsWith(`${chosen}-`)) return false;

      const suffix = candidate.slice(chosen.length + 1).toLowerCase();
      const hasDigits = /\d/.test(suffix);
      const isTier = TIER_SUFFIXES.some((word) => suffix.split(/[^a-z]+/).includes(word));
      return !hasDigits && !isTier;
    });

    if (!isVariant) kept.push(candidate);
  }

  return kept;
}

/** Berapa banyak model cadangan yang disimpan per kunci. */
export const MAX_FALLBACK_MODELS = 4;
