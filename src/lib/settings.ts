import { prisma } from "@/lib/prisma";

/**
 * Pengaturan aplikasi yang dikelola admin lewat dashboard.
 *
 * Disimpan di database, bukan environment variable, supaya admin bisa
 * mengubahnya tanpa deploy ulang.
 */

export const SETTING_KEYS = {
  /** Kuota harian untuk user yang belum membawa kunci provider sendiri. */
  publicDailyLimit: "public_daily_limit",
  /** Batas total percakapan demo dari SELURUH pengunjung dalam sehari. */
  demoGlobalDailyLimit: "demo_global_daily_limit",
  /** Batas per pengunjung (per IP) dalam satu jam. */
  demoIpHourlyLimit: "demo_ip_hourly_limit",
  /** Batas per pengunjung (per IP) dalam sehari. */
  demoIpDailyLimit: "demo_ip_daily_limit",
} as const;

/** Dipakai bila admin belum pernah mengatur nilainya. */
export const DEFAULT_PUBLIC_DAILY_LIMIT = 50;
export const DEFAULT_DEMO_GLOBAL_DAILY_LIMIT = 500;
export const DEFAULT_DEMO_IP_HOURLY_LIMIT = 10;
export const DEFAULT_DEMO_IP_DAILY_LIMIT = 30;

/**
 * Kuota harian pengguna yang mengandalkan Provider Publik.
 *
 * Ini adalah pagar yang tidak bisa dinaikkan sendiri oleh user — berbeda
 * dari `ApiKey.dailyLimit` yang mereka atur sendiri. Tanpa pagar ini, satu
 * pengguna bisa menghabiskan kunci publik milik admin sendirian.
 */
export async function getPublicDailyLimit(): Promise<number> {
  const row = await prisma.setting.findUnique({
    where: { key: SETTING_KEYS.publicDailyLimit },
    select: { value: true },
  });

  const parsed = Number(row?.value);
  return Number.isInteger(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_PUBLIC_DAILY_LIMIT;
}

export async function setPublicDailyLimit(limit: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: SETTING_KEYS.publicDailyLimit },
    create: { key: SETTING_KEYS.publicDailyLimit, value: String(limit) },
    update: { value: String(limit) },
  });
}

/**
 * Pagar total untuk demo halaman depan.
 *
 * Batas per IP saja tidak melindungi operator: seribu pengunjung berbeda
 * berarti seribu jatah terpisah, dan kunci publik bisa terkuras dalam sehari.
 * Angka ini membatasi seluruh trafik demo digabung, sehingga biaya terburuk
 * per hari bisa diperkirakan. Isi 0 untuk mematikan demo sepenuhnya.
 */
export async function getDemoGlobalDailyLimit(): Promise<number> {
  const row = await prisma.setting.findUnique({
    where: { key: SETTING_KEYS.demoGlobalDailyLimit },
    select: { value: true },
  });

  const parsed = Number(row?.value);
  return Number.isInteger(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_DEMO_GLOBAL_DAILY_LIMIT;
}

export async function setDemoGlobalDailyLimit(limit: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: SETTING_KEYS.demoGlobalDailyLimit },
    create: { key: SETTING_KEYS.demoGlobalDailyLimit, value: String(limit) },
    update: { value: String(limit) },
  });
}

/* -------------------------------------------------------------------------- */
/* Batas demo per pengunjung                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Jatah pengunjung yang belum punya akun.
 *
 * Dulu hanya bisa diatur lewat environment variable `DEMO_RATE_LIMIT` dan
 * dimatikan sepenuhnya di mode pengembangan. Dua-duanya bermasalah: mengubah
 * batasnya menuntut deploy ulang, dan perilaku yang berbeda antara
 * pengembangan dan produksi membuat batas ini tidak pernah benar-benar teruji
 * sebelum dipakai sungguhan. Sekarang tersimpan di database seperti pengaturan
 * admin lainnya, dan berlaku sama di mana pun.
 *
 * Isi 0 pada salah satu batas untuk mematikan batas itu.
 */
export interface DemoIpLimits {
  perHour: number;
  perDay: number;
}

async function readLimit(key: string, fallback: number): Promise<number> {
  const row = await prisma.setting.findUnique({
    where: { key },
    select: { value: true },
  });

  const parsed = Number(row?.value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function getDemoIpLimits(): Promise<DemoIpLimits> {
  const [perHour, perDay] = await Promise.all([
    readLimit(SETTING_KEYS.demoIpHourlyLimit, DEFAULT_DEMO_IP_HOURLY_LIMIT),
    readLimit(SETTING_KEYS.demoIpDailyLimit, DEFAULT_DEMO_IP_DAILY_LIMIT),
  ]);
  return { perHour, perDay };
}

export async function setDemoIpLimits(limits: DemoIpLimits): Promise<void> {
  await Promise.all([
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.demoIpHourlyLimit },
      create: {
        key: SETTING_KEYS.demoIpHourlyLimit,
        value: String(limits.perHour),
      },
      update: { value: String(limits.perHour) },
    }),
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.demoIpDailyLimit },
      create: {
        key: SETTING_KEYS.demoIpDailyLimit,
        value: String(limits.perDay),
      },
      update: { value: String(limits.perDay) },
    }),
  ]);
}
