import { NextResponse } from "next/server";

import {
  AiManager,
  AllProvidersFailedError,
  NoProviderAvailableError,
} from "@/lib/ai/ai-manager";
import { parseChatPayload } from "@/lib/api/chat-payload";
import {
  consumeIpRateLimit,
  demoLimitPerHour,
  getClientIp,
  peekIpRateLimit,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Endpoint demo untuk landing page — tanpa API key.
 *
 * Karena terbuka untuk publik, batasannya jauh lebih ketat: rate limit per IP,
 * jumlah token dibatasi, dan hanya menerima satu prompt (bukan riwayat panjang).
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = peekIpRateLimit(ip);

  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterSeconds ?? 0) / 60);
    return NextResponse.json(
      {
        success: false,
        error:
          `Kuota demo habis — ini batas dari gateway ini sendiri (bukan dari penyedia AI), ` +
          `${demoLimitPerHour} percakapan per jam per pengunjung, untuk menjaga kunci provider ` +
          `tidak terkuras. Coba lagi dalam ${minutes} menit, atau daftar gratis untuk ` +
          `mendapat API key dengan kuota harian sendiri.`,
      },
      {
        status: 429,
        headers: limit.retryAfterSeconds
          ? { "Retry-After": String(limit.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json(
      { success: false, error: "Body request bukan JSON yang valid." },
      { status: 400 },
    );
  }

  const parsed = parseChatPayload(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, error: parsed.error },
      { status: 400 },
    );
  }

  try {
    const result = await AiManager.processChat({
      messages: parsed.payload.messages.slice(-4),
      maxTokens: 512,
      apiKeyId: null,
      // Tanpa pemilik: demo hanya boleh memakai kunci di Provider Publik,
      // tidak pernah menyentuh kunci pribadi milik user.
      userId: null,
      source: "demo",
    });

    // Jatah baru dipotong setelah jawaban benar-benar didapat.
    const spent = consumeIpRateLimit(ip);

    return NextResponse.json({
      success: true,
      response: result.text,
      provider: result.provider,
      model: result.model,
      attempts: result.attempts,
      latencyMs: result.latencyMs,
      remaining: spent.remaining,
    });
  } catch (error) {
    if (
      error instanceof NoProviderAvailableError ||
      error instanceof AllProvidersFailedError
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 503 },
      );
    }

    console.error("[/api/demo/chat] kesalahan tak terduga:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal." },
      { status: 500 },
    );
  }
}
