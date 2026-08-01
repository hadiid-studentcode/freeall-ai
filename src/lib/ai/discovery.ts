import {
  AMBIGUOUS_KEY_CANDIDATES,
  findPreset,
  PROVIDER_PRESETS,
  type ProviderFormat,
  type ProviderPreset,
} from "@/lib/ai/providers";

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
export async function detectProvider(apiKey: string): Promise<DetectionResult> {
  const key = apiKey.trim();
  if (!key) return { ok: false, error: "API key kosong." };

  const byPattern = PROVIDER_PRESETS.find(
    (preset) => preset.keyPattern?.test(key) ?? false,
  );

  if (byPattern) {
    const models = await listModels(byPattern, key);
    if (models === null) {
      return {
        ok: false,
        error:
          `Kunci ini dikenali sebagai ${byPattern.label}, tetapi ditolak saat ` +
          `diuji. Periksa apakah kunci masih aktif.`,
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
    error:
      "Tidak bisa mengenali penyedia dari kunci ini. Pilih penyedianya secara " +
      "manual, atau gunakan opsi 'Lainnya' dan isi Base URL sendiri.",
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
  const candidates = models.filter((id) => {
    const lower = id.toLowerCase();
    if (NON_CHAT.some((pattern) => lower.includes(pattern))) return false;
    if (format === "anthropic" && !lower.startsWith("claude")) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  const score = (id: string): number => {
    const lower = id.toLowerCase();
    // Dipecah jadi token supaya pencocokan tidak salah sasaran: substring
    // "mini" ada di dalam "gemini", dan itu sempat membuat model pro menang
    // atas flash. Batas kata menghilangkan seluruh kelas kesalahan ini.
    const tokens = new Set(lower.split(/[^a-z0-9.]+/).filter(Boolean));
    const has = (...words: string[]) => words.some((w) => tokens.has(w));

    let value = 0;

    if (lower.endsWith(":free")) value += 100;
    // Alias yang mengikuti versi terbaru tidak akan usang seperti versi berpatok.
    if (has("latest")) value += 40;
    // Varian ringan biasanya punya kuota gratis paling longgar.
    if (has("flash", "mini", "small", "lite", "instant", "haiku")) value += 25;
    if (has("70b", "72b", "large", "pro", "opus", "sonnet")) value += 15;
    if (has("instruct", "chat", "it")) value += 10;
    // Pratinjau dan eksperimen cenderung punya kuota lebih ketat.
    if (has("preview", "exp", "beta", "alpha")) value -= 30;
    if (has("deprecated", "legacy")) value -= 50;

    return value;
  };

  return candidates.sort((a, b) => score(b) - score(a))[0];
}
