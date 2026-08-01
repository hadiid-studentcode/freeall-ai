import {
  AiProviderError,
  type AiStrategy,
  type ChatMessage,
  type ChatRequest,
  type ChatResult,
} from "@/lib/ai/interfaces/ai-strategy.interface";
import { describeHttpError } from "@/lib/ai/strategies/http-error";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string; status?: string };
}

export interface GeminiStrategyConfig {
  providerName: string;
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

/**
 * Google Gemini memakai format sendiri, bukan format OpenAI:
 * - pesan ada di `contents[].parts[].text`, bukan `messages[].content`
 * - peran "assistant" bernama "model"
 * - pesan sistem dipisah ke `systemInstruction`
 *
 * Perbedaan itu dikurung di kelas ini, sehingga AiManager tetap melihat
 * antarmuka yang sama seperti provider lain.
 */
export class GeminiStrategy implements AiStrategy {
  readonly providerName: string;
  readonly modelName: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: GeminiStrategyConfig) {
    this.providerName = config.providerName;
    this.modelName = config.modelName;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
  }

  async chat(request: ChatRequest): Promise<ChatResult> {
    const systemMessages = request.messages.filter((m) => m.role === "system");
    const conversation = request.messages.filter((m) => m.role !== "system");

    const body: Record<string, unknown> = {
      contents: conversation.map((message: ChatMessage) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 1024,
      },
    };

    if (systemMessages.length > 0) {
      body.systemInstruction = {
        parts: systemMessages.map((m) => ({ text: m.content })),
      };
    }

    const url = `${this.baseUrl}/models/${this.modelName}:generateContent`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Lewat header, bukan query string, supaya kunci tidak bocor ke log URL.
          "x-goog-api-key": this.apiKey,
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

    // Body dibaca sebagai teks lebih dulu supaya respons non-JSON tetap bisa
    // dilaporkan apa adanya, bukan hilang jadi null.
    const rawBody = await response.text().catch(() => "");
    let payload: GeminiResponse | null = null;
    try {
      payload = rawBody ? (JSON.parse(rawBody) as GeminiResponse) : null;
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

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      // Umumnya terjadi saat safety filter memblokir jawaban.
      const reason = payload?.candidates?.[0]?.finishReason;
      throw new AiProviderError(
        this.providerName,
        reason
          ? `Gemini tidak mengembalikan teks (finishReason: ${reason})`
          : "Gemini membalas tanpa isi pesan",
        { status: response.status },
      );
    }

    return {
      text,
      provider: this.providerName,
      model: this.modelName,
      usage: {
        promptTokens: payload?.usageMetadata?.promptTokenCount,
        completionTokens: payload?.usageMetadata?.candidatesTokenCount,
        totalTokens: payload?.usageMetadata?.totalTokenCount,
      },
    };
  }
}
