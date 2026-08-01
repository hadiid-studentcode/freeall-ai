import {
  AiProviderError,
  type AiStrategy,
  type ChatRequest,
  type ChatResult,
} from "@/lib/ai/interfaces/ai-strategy.interface";
import { describeHttpError } from "@/lib/ai/strategies/http-error";

interface OpenAiCompatibleResponse {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; type?: string };
}

export interface UniversalStrategyConfig {
  providerName: string;
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

/**
 * Menangani semua provider yang kompatibel dengan format OpenAI
 * (Groq, DeepSeek, Mistral, OpenRouter, Cerebras, Together, dan ratusan lain).
 *
 * Satu kelas ini cukup karena mereka menyepakati bentuk request/response yang
 * sama; yang berbeda hanya base URL dan nama model.
 */
export class UniversalStrategy implements AiStrategy {
  readonly providerName: string;
  readonly modelName: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: UniversalStrategyConfig) {
    this.providerName = config.providerName;
    this.modelName = config.modelName;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
  }

  async chat(request: ChatRequest): Promise<ChatResult> {
    const url = `${this.baseUrl}/chat/completions`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1024,
          stream: false,
        }),
        signal: request.signal,
      });
    } catch (error) {
      // Jaringan putus / timeout: tidak ada status HTTP, dianggap transient.
      throw new AiProviderError(
        this.providerName,
        error instanceof Error ? error.message : "Permintaan jaringan gagal",
        { cause: error },
      );
    }

    // Body dibaca sebagai teks lebih dulu supaya respons non-JSON tetap bisa
    // dilaporkan apa adanya, bukan hilang jadi null.
    const rawBody = await response.text().catch(() => "");
    let payload: OpenAiCompatibleResponse | null = null;
    try {
      payload = rawBody ? (JSON.parse(rawBody) as OpenAiCompatibleResponse) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new AiProviderError(
        this.providerName,
        describeHttpError({
          status: response.status,
          statusText: response.statusText,
          url,
          structuredMessage: payload?.error?.message,
          rawBody,
        }),
        { status: response.status },
      );
    }

    const text = payload?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      // Status 200 tapi tanpa isi — diperlakukan sebagai kegagalan agar
      // AiManager melanjutkan ke kunci berikutnya, bukan mengembalikan kosong.
      throw new AiProviderError(
        this.providerName,
        "Provider membalas tanpa isi pesan",
        { status: response.status },
      );
    }

    return {
      text,
      provider: this.providerName,
      model: this.modelName,
      usage: {
        promptTokens: payload?.usage?.prompt_tokens,
        completionTokens: payload?.usage?.completion_tokens,
        totalTokens: payload?.usage?.total_tokens,
      },
    };
  }
}
