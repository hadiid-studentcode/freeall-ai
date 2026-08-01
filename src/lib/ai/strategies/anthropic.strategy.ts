import {
  AiProviderError,
  type AiStrategy,
  type ChatRequest,
  type ChatResult,
} from "@/lib/ai/interfaces/ai-strategy.interface";
import { describeHttpError } from "@/lib/ai/strategies/http-error";

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  stop_reason?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { type?: string; message?: string };
}

export interface AnthropicStrategyConfig {
  providerName: string;
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

/** Versi API Anthropic; wajib dikirim di setiap request. */
const ANTHROPIC_VERSION = "2023-06-01";

/**
 * Anthropic (Claude) memakai format sendiri, berbeda dari OpenAI:
 * - endpoint `/messages`, bukan `/chat/completions`
 * - autentikasi lewat header `x-api-key`, bukan `Authorization: Bearer`
 * - pesan sistem dipindah ke parameter `system` di level atas
 * - balasan ada di array `content[]` berisi blok, bukan `choices[].message`
 * - `max_tokens` wajib diisi
 */
export class AnthropicStrategy implements AiStrategy {
  readonly providerName: string;
  readonly modelName: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: AnthropicStrategyConfig) {
    this.providerName = config.providerName;
    this.modelName = config.modelName;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
  }

  async chat(request: ChatRequest): Promise<ChatResult> {
    const systemMessages = request.messages.filter((m) => m.role === "system");
    const conversation = request.messages.filter((m) => m.role !== "system");

    const body: Record<string, unknown> = {
      model: this.modelName,
      max_tokens: request.maxTokens ?? 1024,
      messages: conversation.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.map((m) => m.content).join("\n\n");
    }

    // `temperature` sengaja TIDAK dikirim. Model Claude generasi terbaru
    // (Opus 5, Opus 4.8/4.7, Sonnet 5) menolak parameter sampling dengan
    // HTTP 400, sehingga meneruskannya justru mematikan provider ini.

    const url = `${this.baseUrl}/messages`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
        signal: request.signal,
      });
    } catch (error) {
      throw new AiProviderError(
        this.providerName,
        error instanceof Error ? error.message : "Permintaan jaringan gagal",
        { cause: error },
      );
    }

    const rawBody = await response.text().catch(() => "");
    let payload: AnthropicResponse | null = null;
    try {
      payload = rawBody ? (JSON.parse(rawBody) as AnthropicResponse) : null;
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

    // Claude bisa menolak permintaan lewat HTTP 200 dengan stop_reason
    // "refusal" dan content kosong — diperlakukan sebagai kegagalan agar
    // AiManager melanjutkan ke kunci berikutnya.
    if (payload?.stop_reason === "refusal") {
      throw new AiProviderError(
        this.providerName,
        "Claude menolak permintaan ini (stop_reason: refusal).",
        { status: response.status },
      );
    }

    const text = payload?.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new AiProviderError(
        this.providerName,
        "Claude membalas tanpa isi teks",
        { status: response.status },
      );
    }

    return {
      text,
      provider: this.providerName,
      model: this.modelName,
      usage: {
        promptTokens: payload?.usage?.input_tokens,
        completionTokens: payload?.usage?.output_tokens,
        totalTokens:
          payload?.usage?.input_tokens !== undefined &&
          payload?.usage?.output_tokens !== undefined
            ? payload.usage.input_tokens + payload.usage.output_tokens
            : undefined,
      },
    };
  }
}
