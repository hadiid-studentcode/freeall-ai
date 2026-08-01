/**
 * Katalog penyedia AI.
 *
 * Preset hanya menyediakan nilai default. Kolom `baseUrl` dan `modelName` di
 * tabel ProviderKey selalu menang, sehingga provider yang belum terdaftar di
 * sini tetap bisa dipakai lewat opsi "custom".
 *
 * PENTING — nama model cepat usang. Penyedia rutin memensiunkan model lama
 * (404 "no longer available") atau menutup kuota gratisnya (429 dengan
 * `limit: 0`). Karena itu sistem lebih memilih menanyakan daftar model yang
 * hidup langsung ke penyedia (lihat `discovery.ts`) ketimbang memercayai
 * `defaultModel` di bawah, yang hanya dipakai sebagai cadangan.
 */

export type ProviderFormat = "openai" | "gemini" | "anthropic";

export interface ProviderPreset {
  /** Nilai yang disimpan di kolom ProviderKey.providerName. */
  id: string;
  label: string;
  format: ProviderFormat;
  baseUrl: string;
  defaultModel: string;
  /** Tempat user mengambil API key. */
  consoleUrl: string;
  /** Ada tier gratis? Dipakai UI untuk menandai. */
  free: boolean;
  /**
   * Pola awalan kunci untuk deteksi otomatis. Kosongkan bila formatnya
   * generik (mis. `sk-…` yang dipakai banyak penyedia sekaligus) — penyedia
   * seperti itu dideteksi lewat pengujian endpoint, bukan tebak awalan.
   */
  keyPattern?: RegExp;
  note?: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "groq",
    label: "Groq",
    format: "openai",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    consoleUrl: "https://console.groq.com/keys",
    free: true,
    keyPattern: /^gsk_/,
    note: "Inferensi tercepat, tier gratis cukup longgar.",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    format: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    // Alias yang selalu menunjuk model flash terbaru. Versi berpatok seperti
    // gemini-2.0-flash sudah kehilangan kuota gratis (429, limit: 0).
    defaultModel: "gemini-flash-latest",
    consoleUrl: "https://aistudio.google.com/apikey",
    free: true,
    keyPattern: /^(AIza|AQ\.)/,
    note: "Format request berbeda dari OpenAI — ditangani GeminiStrategy.",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    format: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-opus-5",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    free: false,
    keyPattern: /^sk-ant-/,
    note: "Berbayar, tanpa tier gratis. Format request khas Anthropic.",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    format: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-oss-20b:free",
    consoleUrl: "https://openrouter.ai/keys",
    free: true,
    keyPattern: /^sk-or-v1-/,
    note: "Agregator; cek daftar model bertanda :free yang sedang aktif.",
  },
  {
    id: "cerebras",
    label: "Cerebras",
    format: "openai",
    baseUrl: "https://api.cerebras.ai/v1",
    defaultModel: "llama-3.3-70b",
    consoleUrl: "https://cloud.cerebras.ai",
    free: true,
    keyPattern: /^csk-/,
  },
  {
    id: "nvidia",
    label: "NVIDIA NIM",
    format: "openai",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "meta/llama-3.3-70b-instruct",
    consoleUrl: "https://build.nvidia.com",
    free: true,
    keyPattern: /^nvapi-/,
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    format: "openai",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-4-fast",
    consoleUrl: "https://console.x.ai",
    free: false,
    keyPattern: /^xai-/,
  },
  {
    id: "fireworks",
    label: "Fireworks AI",
    format: "openai",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    defaultModel: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    consoleUrl: "https://fireworks.ai/account/api-keys",
    free: false,
    keyPattern: /^fw_/,
  },
  {
    id: "openai",
    label: "OpenAI",
    format: "openai",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    consoleUrl: "https://platform.openai.com/api-keys",
    free: false,
    // Kunci OpenAI memakai awalan `sk-` yang juga dipakai DeepSeek dan
    // Mistral, jadi tidak bisa dibedakan dari awalannya saja.
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    format: "openai",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    consoleUrl: "https://platform.deepseek.com/api_keys",
    free: false,
  },
  {
    id: "mistral",
    label: "Mistral AI",
    format: "openai",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    consoleUrl: "https://console.mistral.ai/api-keys",
    free: true,
  },
  {
    id: "together",
    label: "Together AI",
    format: "openai",
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    consoleUrl: "https://api.together.ai/settings/api-keys",
    free: true,
  },
  {
    id: "sambanova",
    label: "SambaNova",
    format: "openai",
    baseUrl: "https://api.sambanova.ai/v1",
    defaultModel: "Meta-Llama-3.3-70B-Instruct",
    consoleUrl: "https://cloud.sambanova.ai/apis",
    free: true,
  },
  {
    id: "custom",
    label: "Lainnya (OpenAI-compatible)",
    format: "openai",
    baseUrl: "",
    defaultModel: "",
    consoleUrl: "",
    free: false,
    note: "Isi Base URL dan Model secara manual.",
  },
];

export function findPreset(providerName: string): ProviderPreset | undefined {
  const needle = providerName.trim().toLowerCase();
  return PROVIDER_PRESETS.find((preset) => preset.id === needle);
}

/** Penyedia yang bisa dicoba saat awalan kunci tidak menunjuk satu penyedia. */
export const AMBIGUOUS_KEY_CANDIDATES = [
  "deepseek",
  "openai",
  "mistral",
  "together",
  "sambanova",
] as const;
