import { prisma } from "@/lib/prisma";

/**
 * Fase 4 — pembatasan pemakaian.
 *
 * Dua lapis dengan sifat berbeda:
 *
 * 1. Kuota harian — dihitung dari tabel RequestLog, jadi akurat dan konsisten
 *    di semua instance aplikasi.
 * 2. Burst limiter — penghitung di memori proses. Murah dan cepat, tapi
 *    CATATAN PENTING: hanya berlaku per instance. Di deployment serverless
 *    atau multi-replica, tiap instance punya hitungannya sendiri. Untuk
 *    penegakan yang ketat lintas instance, ganti bagian ini dengan Redis
 *    (mis. Upstash) — antarmuka fungsinya sudah disiapkan agar mudah ditukar.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Sisa jatah pada jendela yang sedang berjalan. */
  remaining: number;
  /** Detik sampai jatah dipulihkan; diisi hanya saat ditolak. */
  retryAfterSeconds?: number;
  reason?: string;
}

/* -------------------------------------------------------------------------- */
/* Kuota harian berbasis database                                             */
/* -------------------------------------------------------------------------- */

export async function checkDailyQuota(
  apiKeyId: string,
  dailyLimit: number,
): Promise<RateLimitResult> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const used = await prisma.requestLog.count({
    where: { apiKeyId, createdAt: { gte: startOfDay } },
  });

  if (used >= dailyLimit) {
    const nextMidnight = new Date(startOfDay);
    nextMidnight.setDate(nextMidnight.getDate() + 1);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((nextMidnight.getTime() - Date.now()) / 1000),
      reason: `Kuota harian ${dailyLimit} request sudah terpakai habis.`,
    };
  }

  return { allowed: true, remaining: dailyLimit - used };
}

/* -------------------------------------------------------------------------- */
/* Burst limiter di memori                                                    */
/* -------------------------------------------------------------------------- */

interface WindowState {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowState>();

/** Buang entri kedaluwarsa supaya Map tidak tumbuh tanpa batas. */
function sweep(now: number): void {
  if (windows.size < 1_000) return;
  for (const [key, state] of windows) {
    if (state.resetAt <= now) windows.delete(key);
  }
}

function consume(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const state = windows.get(key);

  if (!state || state.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (state.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((state.resetAt - now) / 1000),
      reason: `Terlalu banyak request. Batas ${limit} per ${Math.round(windowMs / 1000)} detik.`,
    };
  }

  state.count += 1;
  return { allowed: true, remaining: limit - state.count };
}

/** Lonjakan per API key: 30 request per menit. */
export function checkBurstLimit(apiKeyId: string): RateLimitResult {
  return consume(`key:${apiKeyId}`, 30, 60_000);
}

/** Endpoint demo tidak butuh API key, jadi dibatasi per IP: 8 request per jam. */
export function checkIpRateLimit(ip: string): RateLimitResult {
  return consume(`ip:${ip}`, 8, 60 * 60_000);
}

/** Ambil IP klien dari header proxy yang lazim dipakai. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
