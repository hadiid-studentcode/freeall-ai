import { NextResponse } from "next/server";

import {
  AiManager,
  AllProvidersFailedError,
  NoProviderAvailableError,
} from "@/lib/ai/ai-manager";
import { parseChatPayload } from "@/lib/api/chat-payload";
import {
  checkDemoGlobalQuota,
  consumeIpRateLimit,
  demoLimitPerHour,
  getClientIp,
  peekIpRateLimit,
} from "@/lib/rate-limit";
import { getTranslations } from "@/lib/i18n";

export const runtime = "nodejs";

/**
 * Endpoint demo untuk landing page — tanpa API key.
 *
 * Karena terbuka untuk publik, batasannya jauh lebih ketat: rate limit per IP,
 * jumlah token dibatasi, dan hanya menerima satu prompt (bukan riwayat panjang).
 */
export async function POST(request: Request) {
  // Dipanggil peramban, jadi cookie bahasa ikut terkirim dan pesan error
  // bisa mengikuti bahasa pengunjung.
  const { t } = await getTranslations();
  const d = t.errors.demo;

  // Pagar total lebih dulu: inilah yang melindungi biaya operator dari
  // banyak IP berbeda, sesuatu yang tidak bisa dilakukan batas per-IP.
  const globalQuota = await checkDemoGlobalQuota(d.globalQuota);
  if (!globalQuota.allowed) {
    return NextResponse.json(
      { success: false, error: globalQuota.reason },
      {
        status: 429,
        headers: globalQuota.retryAfterSeconds
          ? { "Retry-After": String(globalQuota.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  const ip = getClientIp(request);
  const limit = peekIpRateLimit(ip);

  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterSeconds ?? 0) / 60);
    return NextResponse.json(
      {
        success: false,
        error: d.hourlyLimit(demoLimitPerHour ?? 0, minutes),
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
      { success: false, error: d.invalidJson },
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
    // Pesan kelas error milik AiManager dipakai bersama `/api/v1/chat` yang
    // machine-facing, jadi di sini dipetakan ke kalimat yang sudah dwibahasa.
    if (error instanceof NoProviderAvailableError) {
      return NextResponse.json(
        { success: false, error: d.noProvider },
        { status: 503 },
      );
    }
    if (error instanceof AllProvidersFailedError) {
      return NextResponse.json(
        { success: false, error: d.allFailed },
        { status: 503 },
      );
    }

    console.error("[/api/demo/chat] kesalahan tak terduga:", error);
    return NextResponse.json(
      { success: false, error: d.internal },
      { status: 500 },
    );
  }
}
