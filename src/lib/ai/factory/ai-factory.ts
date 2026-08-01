import type { AiStrategy } from "@/lib/ai/interfaces/ai-strategy.interface";
import { findPreset } from "@/lib/ai/providers";
import { AnthropicStrategy } from "@/lib/ai/strategies/anthropic.strategy";
import { GeminiStrategy } from "@/lib/ai/strategies/gemini.strategy";
import { UniversalStrategy } from "@/lib/ai/strategies/universal.strategy";
import { decryptSecret } from "@/lib/crypto";

/** Kolom ProviderKey yang dibutuhkan Factory (bukan seluruh baris). */
export interface ProviderKeyConfig {
  providerName: string;
  keyCiphertext: string;
  format: string;
  baseUrl: string | null;
  modelName: string | null;
}

export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}

/**
 * Merakit objek strategy dari satu baris ProviderKey (Factory Pattern).
 *
 * Urutan prioritas nilai: kolom database > preset provider > error eksplisit.
 * Dengan begitu provider yang belum dikenal tetap bisa dipakai selama user
 * mengisi baseUrl dan modelName sendiri.
 */
export class AiFactory {
  static create(providerKey: ProviderKeyConfig): AiStrategy {
    const preset = findPreset(providerKey.providerName);

    const baseUrl = providerKey.baseUrl?.trim() || preset?.baseUrl || "";
    const modelName = providerKey.modelName?.trim() || preset?.defaultModel || "";
    const format = providerKey.format?.trim() || preset?.format || "openai";

    if (!baseUrl) {
      throw new ProviderConfigError(
        `Provider "${providerKey.providerName}" tidak punya Base URL. ` +
          `Isi kolom baseUrl atau pakai provider yang sudah ada presetnya.`,
      );
    }
    if (!modelName) {
      throw new ProviderConfigError(
        `Provider "${providerKey.providerName}" tidak punya nama model. ` +
          `Isi kolom modelName.`,
      );
    }

    const apiKey = decryptSecret(providerKey.keyCiphertext);
    const config = {
      providerName: providerKey.providerName,
      apiKey,
      baseUrl,
      modelName,
    };

    // Gemini dan Anthropic punya bentuk request sendiri; sisanya —
    // ratusan penyedia lain — memakai format standar OpenAI.
    switch (format) {
      case "gemini":
        return new GeminiStrategy(config);
      case "anthropic":
        return new AnthropicStrategy(config);
      default:
        return new UniversalStrategy(config);
    }
  }
}
