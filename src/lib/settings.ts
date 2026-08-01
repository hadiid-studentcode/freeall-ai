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
} as const;

/** Dipakai bila admin belum pernah mengatur nilainya. */
export const DEFAULT_PUBLIC_DAILY_LIMIT = 50;

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
