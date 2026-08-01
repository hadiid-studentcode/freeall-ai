/**
 * Kontrak yang wajib dipatuhi semua penyedia AI (Strategy Pattern).
 *
 * Berkat kontrak ini, AiManager tidak perlu tahu apa pun soal perbedaan format
 * antar vendor — cukup panggil `chat()` dan tangani `AiProviderError`.
 */

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Dipakai AiManager untuk memaksa timeout per provider. */
  signal?: AbortSignal;
}

export interface ChatUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ChatResult {
  text: string;
  provider: string;
  model: string;
  usage?: ChatUsage;
}

export interface AiStrategy {
  readonly providerName: string;
  readonly modelName: string;
  chat(request: ChatRequest): Promise<ChatResult>;
}

/**
 * Error terklasifikasi dari sebuah provider.
 *
 * Klasifikasi sengaja dipusatkan di sini, bukan disebar di AiManager, supaya
 * menambah vendor baru tidak menuntut perubahan pada logika fallback.
 */
export class AiProviderError extends Error {
  readonly provider: string;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(
    provider: string,
    message: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(message);
    this.name = "AiProviderError";
    this.provider = provider;
    this.status = options.status;
    this.cause = options.cause;
  }

  /** 429 — kuota/limit habis. Kunci masih sah, tinggal dicoba lagi nanti. */
  get isRateLimit(): boolean {
    return this.status === 429;
  }

  /** 401/403 — kunci ditolak permanen, harus dinonaktifkan. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** Gangguan sementara di sisi provider (5xx, timeout, jaringan putus). */
  get isTransient(): boolean {
    return this.status === undefined || this.status >= 500;
  }
}
