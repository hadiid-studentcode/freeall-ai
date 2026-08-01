import { NextResponse } from "next/server";

import {
  AiManager,
  AllProvidersFailedError,
  NoProviderAvailableError,
} from "@/lib/ai/ai-manager";
import { authenticateRequest } from "@/lib/api/authenticate";
import { parseChatPayload } from "@/lib/api/chat-payload";
import { checkBurstLimit, checkDailyQuota } from "@/lib/rate-limit";

// Butuh node:crypto (dekripsi kunci) dan driver pg, jadi bukan edge runtime.
export const runtime = "nodejs";

/**
 * Endpoint utama gateway.
 *
 * Alur: verifikasi kunci SaaS → cek kuota → validasi body → AiManager
 * (yang menangani fallback antar provider) → balas JSON.
 */
export async function POST(request: Request) {
  // 1. Fase 2 — autentikasi klien
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status },
    );
  }

  // 2. Fase 4 — rate limiting
  const burst = checkBurstLimit(auth.apiKey.id);
  if (!burst.allowed) {
    return rateLimited(burst.reason, burst.retryAfterSeconds);
  }

  const quota = await checkDailyQuota(auth.apiKey.id, auth.apiKey.dailyLimit);
  if (!quota.allowed) {
    return rateLimited(quota.reason, quota.retryAfterSeconds);
  }

  // 3. Validasi body
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

  // 4. Eksekusi dengan fallback
  try {
    const result = await AiManager.processChat({
      ...parsed.payload,
      apiKeyId: auth.apiKey.id,
      source: "api",
    });

    return NextResponse.json(
      {
        success: true,
        response: result.text,
        provider: result.provider,
        model: result.model,
        attempts: result.attempts,
        latencyMs: result.latencyMs,
        usage: result.usage,
        // Berguna untuk menelusuri kunci mana yang sempat gagal.
        fallbacks: result.failures.map((failure) => ({
          provider: failure.provider,
          status: failure.status,
          error: failure.message,
        })),
      },
      {
        headers: {
          "X-RateLimit-Remaining-Day": String(Math.max(quota.remaining - 1, 0)),
        },
      },
    );
  } catch (error) {
    if (error instanceof NoProviderAvailableError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 503 },
      );
    }

    if (error instanceof AllProvidersFailedError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          fallbacks: error.failures.map((failure) => ({
            provider: failure.provider,
            status: failure.status,
            error: failure.message,
          })),
        },
        { status: 503 },
      );
    }

    console.error("[/api/v1/chat] kesalahan tak terduga:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal." },
      { status: 500 },
    );
  }
}

function rateLimited(
  reason: string | undefined,
  retryAfter: number | undefined,
) {
  return NextResponse.json(
    { success: false, error: reason ?? "Batas pemakaian terlampaui." },
    {
      status: 429,
      headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined,
    },
  );
}
