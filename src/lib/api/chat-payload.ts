import type { ChatMessage, ChatRole } from "@/lib/ai/interfaces/ai-strategy.interface";

export interface ParsedChatPayload {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  provider?: string;
}

export type ParseResult =
  | { ok: true; payload: ParsedChatPayload }
  | { ok: false; error: string };

const VALID_ROLES: ChatRole[] = ["system", "user", "assistant"];
const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 32_000;

/**
 * Terima dua bentuk body:
 * - `{ "prompt": "Halo!" }` — bentuk ringkas sesuai blueprint
 * - `{ "messages": [{ "role": "user", "content": "Halo!" }] }` — percakapan multi-giliran
 */
export function parseChatPayload(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body request harus berupa objek JSON." };
  }

  const input = body as Record<string, unknown>;
  const messages = input.messages ?? null;
  const prompt = input.prompt ?? null;

  let parsedMessages: ChatMessage[];

  if (Array.isArray(messages)) {
    if (messages.length === 0) {
      return { ok: false, error: "Field 'messages' tidak boleh kosong." };
    }
    if (messages.length > MAX_MESSAGES) {
      return {
        ok: false,
        error: `Terlalu banyak pesan (maksimal ${MAX_MESSAGES}).`,
      };
    }

    const collected: ChatMessage[] = [];
    for (const [index, item] of messages.entries()) {
      const message = item as Record<string, unknown>;
      const role = message?.role;
      const content = message?.content;

      if (!VALID_ROLES.includes(role as ChatRole)) {
        return {
          ok: false,
          error: `messages[${index}].role harus salah satu dari: ${VALID_ROLES.join(", ")}.`,
        };
      }
      if (typeof content !== "string" || content.trim() === "") {
        return {
          ok: false,
          error: `messages[${index}].content harus berupa teks yang tidak kosong.`,
        };
      }
      if (content.length > MAX_CONTENT_LENGTH) {
        return {
          ok: false,
          error: `messages[${index}].content melebihi ${MAX_CONTENT_LENGTH} karakter.`,
        };
      }

      collected.push({ role: role as ChatRole, content });
    }
    parsedMessages = collected;
  } else if (typeof prompt === "string") {
    if (prompt.trim() === "") {
      return { ok: false, error: "Field 'prompt' tidak boleh kosong." };
    }
    if (prompt.length > MAX_CONTENT_LENGTH) {
      return {
        ok: false,
        error: `Field 'prompt' melebihi ${MAX_CONTENT_LENGTH} karakter.`,
      };
    }
    parsedMessages = [{ role: "user", content: prompt }];
  } else {
    return {
      ok: false,
      error: "Sertakan field 'prompt' (teks) atau 'messages' (array).",
    };
  }

  const temperature = toNumber(input.temperature);
  if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
    return { ok: false, error: "Field 'temperature' harus antara 0 dan 2." };
  }

  const maxTokens = toNumber(input.max_tokens ?? input.maxTokens);
  if (maxTokens !== undefined && (maxTokens < 1 || maxTokens > 8192)) {
    return { ok: false, error: "Field 'max_tokens' harus antara 1 dan 8192." };
  }

  return {
    ok: true,
    payload: {
      messages: parsedMessages,
      temperature,
      maxTokens,
      provider:
        typeof input.provider === "string" && input.provider.trim() !== ""
          ? input.provider.trim().toLowerCase()
          : undefined,
    },
  };
}

function toNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return value;
}
