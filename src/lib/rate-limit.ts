import { isProduction } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { resolvePlan } from "@/lib/plans";
import {
  getDemoGlobalDailyLimit,
  getPublicDailyLimit,
} from "@/lib/settings";

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

/**
 * Kuota harian untuk pengguna yang mengandalkan Provider Publik.
 *
 * Hanya berlaku bila user belum punya kunci provider aktif miliknya sendiri.
 * Begitu ia menambahkan kunci sendiri, pagar ini lepas — kuota yang terpakai
 * adalah kuotanya sendiri, bukan milik admin.
 *
 * Berbeda dari `ApiKey.dailyLimit` yang diatur user sendiri, batas ini
 * ditentukan admin dan tidak bisa dinaikkan dari sisi pengguna.
 */
export async function checkPublicPoolQuota(
  userId: string,
): Promise<RateLimitResult> {
  const [ownActiveKeys, user] = await Promise.all([
    prisma.providerKey.count({ where: { userId, isActive: true } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true, role: true },
    }),
  ]);

  // Punya kunci sendiri → tidak memakai jatah publik.
  if (ownActiveKeys > 0) return { allowed: true, remaining: Infinity };

  // Batas paket dan batas global admin dua-duanya berlaku; yang lebih kecil
  // menang. Admin tetap bisa menurunkan jatah semua orang saat kunci publik
  // menipis, tanpa harus menyentuh paket satu per satu.
  const adminLimit = await getPublicDailyLimit();
  const planLimit = user ? resolvePlan(user).publicDailyLimit : 0;
  const limit = Math.min(adminLimit, planLimit);

  if (limit === 0) {
    return {
      allowed: false,
      remaining: 0,
      reason:
        "Admin menutup pemakaian Provider Publik. Tambahkan kunci provider " +
        "Anda sendiri di dashboard untuk mulai memakai gateway.",
    };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const used = await prisma.requestLog.count({
    where: { apiKey: { userId }, createdAt: { gte: startOfDay } },
  });

  if (used >= limit) {
    const nextMidnight = new Date(startOfDay);
    nextMidnight.setDate(nextMidnight.getDate() + 1);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((nextMidnight.getTime() - Date.now()) / 1000),
      reason:
        `Kuota harian Provider Publik (${limit} request) sudah habis. ` +
        `Tambahkan kunci provider Anda sendiri di dashboard untuk pemakaian ` +
        `tanpa batas ini, atau tunggu sampai tengah malam.`,
    };
  }

  return { allowed: true, remaining: limit - used };
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
  /** false = hanya mengintip sisa jatah, tanpa memakainya. */
  commit = true,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const state = windows.get(key);

  if (!state || state.resetAt <= now) {
    if (commit) windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - (commit ? 1 : 0) };
  }

  if (state.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((state.resetAt - now) / 1000),
      reason: `Terlalu banyak request. Batas ${limit} per ${Math.round(windowMs / 1000)} detik.`,
    };
  }

  if (commit) state.count += 1;
  return { allowed: true, remaining: limit - state.count };
}

/**
 * Lonjakan per API key. Batasnya mengikuti paket langganan pemiliknya —
 * paket berbayar mendapat jendela yang lebih longgar.
 */
export function checkBurstLimit(
  apiKeyId: string,
  perMinute: number,
): RateLimitResult {
  return consume(`key:${apiKeyId}`, perMinute, 60_000);
}

/**
 * Demo landing page: tanpa API key, dibatasi per IP.
 *
 * Batas ini menjaga instance publik agar kunci provider tidak dihabiskan
 * pengunjung. Pada instance self-hosted yang dipakai pemiliknya sendiri
 * batas itu justru mengganggu, jadi:
 * - di mode pengembangan batas dimatikan sepenuhnya;
 * - di produksi bisa diatur lewat `DEMO_RATE_LIMIT` (0 = tanpa batas).
 */
const DEMO_LIMIT = Number(process.env.DEMO_RATE_LIMIT ?? 10);
const DEMO_WINDOW_MS = 60 * 60_000;
/** Batas kedua per IP, sepanjang hari — menahan pemakaian jam demi jam. */
const DEMO_DAILY_LIMIT = DEMO_LIMIT * 3;
const DEMO_DAY_MS = 24 * 60 * 60_000;
const DEMO_LIMIT_ENABLED =
  isProduction && Number.isFinite(DEMO_LIMIT) && DEMO_LIMIT > 0;

const UNLIMITED: RateLimitResult = { allowed: true, remaining: Infinity };

/**
 * Cek jatah demo TANPA memakainya.
 *
 * Pemakaian baru dicatat lewat `consumeIpRateLimit` setelah jawaban benar-benar
 * diterima — supaya kegagalan di sisi provider tidak ikut menghabiskan jatah
 * pengunjung, yang dulu membuat demo terasa "habis" padahal belum dipakai.
 */
export function peekIpRateLimit(ip: string): RateLimitResult {
  if (!DEMO_LIMIT_ENABLED) return UNLIMITED;

  // Dua jendela sekaligus: yang per jam menahan lonjakan, yang harian
  // menahan pemakaian yang dicicil sepanjang hari.
  const hourly = consume(`ip:h:${ip}`, DEMO_LIMIT, DEMO_WINDOW_MS, false);
  if (!hourly.allowed) return hourly;

  return consume(`ip:d:${ip}`, DEMO_DAILY_LIMIT, DEMO_DAY_MS, false);
}

export function consumeIpRateLimit(ip: string): RateLimitResult {
  if (!DEMO_LIMIT_ENABLED) return UNLIMITED;
  consume(`ip:d:${ip}`, DEMO_DAILY_LIMIT, DEMO_DAY_MS, true);
  return consume(`ip:h:${ip}`, DEMO_LIMIT, DEMO_WINDOW_MS, true);
}

/**
 * Pagar total demo dari seluruh pengunjung hari ini.
 *
 * Berbasis database, bukan memori, karena inilah yang benar-benar melindungi
 * biaya operator dan harus tetap akurat walau aplikasi berjalan di banyak
 * instance sekaligus.
 */
export async function checkDemoGlobalQuota(
  exhaustedMessage: string,
): Promise<RateLimitResult> {
  const limit = await getDemoGlobalDailyLimit();
  if (limit === 0) {
    return {
      allowed: false,
      remaining: 0,
      reason: "Demo halaman depan sedang dimatikan oleh admin.",
    };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const used = await prisma.requestLog.count({
    where: { source: "demo", createdAt: { gte: startOfDay } },
  });

  if (used >= limit) {
    const nextMidnight = new Date(startOfDay);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((nextMidnight.getTime() - Date.now()) / 1000),
      reason: exhaustedMessage,
    };
  }

  return { allowed: true, remaining: limit - used };
}

export const demoLimitPerHour = DEMO_LIMIT_ENABLED ? DEMO_LIMIT : null;

/** Ambil IP klien dari header proxy yang lazim dipakai. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/* -------------------------------------------------------------------------- */
/* Pembatas percobaan masuk                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Batasi percobaan login dan pendaftaran.
 *
 * Tanpa ini, kata sandi bisa ditebak berulang-ulang tanpa hambatan. Dihitung
 * per identitas (email) maupun per IP: yang pertama menahan serangan ke satu
 * akun tertentu, yang kedua menahan penyisiran banyak akun dari satu sumber.
 *
 * Jatah hanya berkurang saat percobaan GAGAL, sehingga pemakaian normal tidak
 * pernah terkena.
 */
const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60_000;

export function checkLoginAttempts(
  email: string,
  ip: string,
): RateLimitResult {
  const byEmail = consume(
    `login:email:${email}`,
    LOGIN_MAX_ATTEMPTS,
    LOGIN_WINDOW_MS,
    false,
  );
  if (!byEmail.allowed) return byEmail;

  return consume(`login:ip:${ip}`, LOGIN_MAX_ATTEMPTS * 3, LOGIN_WINDOW_MS, false);
}

export function recordFailedLogin(email: string, ip: string): void {
  consume(`login:email:${email}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS, true);
  consume(`login:ip:${ip}`, LOGIN_MAX_ATTEMPTS * 3, LOGIN_WINDOW_MS, true);
}
