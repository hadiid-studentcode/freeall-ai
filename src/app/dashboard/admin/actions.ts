"use server";

import { revalidatePath } from "next/cache";

import type { Plan } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth/guard";
import { PLAN_ORDER } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { setPublicDailyLimit } from "@/lib/settings";

/**
 * Aksi khusus admin.
 *
 * Setiap aksi memanggil `requireAdmin()` sendiri — Server Action bisa dipicu
 * lewat POST langsung tanpa membuka halaman admin, jadi penjagaan di halaman
 * saja tidak cukup.
 */

/** Masukkan atau keluarkan sebuah kunci provider dari Provider Publik. */
export async function toggleKeyScopeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const key = await prisma.providerKey.findUnique({
    where: { id },
    select: { scope: true },
  });
  if (!key) return;

  await prisma.providerKey.update({
    where: { id },
    data: { scope: key.scope === "SHARED" ? "PRIVATE" : "SHARED" },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/providers");
}

/**
 * Tetapkan kuota harian untuk pengguna yang belum membawa kunci sendiri.
 *
 * Ini pagar yang tidak bisa dinaikkan pengguna — berbeda dari kuota per
 * API key yang mereka atur sendiri. Isi 0 untuk menutup pemakaian Provider
 * Publik sepenuhnya.
 */
export async function updatePublicDailyLimitAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const limit = Number(formData.get("limit") ?? -1);

  if (!Number.isInteger(limit) || limit < 0 || limit > 100_000) return;

  await setPublicDailyLimit(limit);
  revalidatePath("/dashboard/admin");
}

/**
 * Ubah paket langganan seorang pengguna.
 *
 * Selama pembayaran otomatis belum tersambung, ini jalur resmi untuk
 * mengaktifkan langganan setelah konfirmasi pembayaran. `durationDays`
 * kosong berarti tanpa masa berlaku.
 */
export async function updateUserPlanAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const plan = String(formData.get("plan") ?? "");
  const durationDays = Number(formData.get("durationDays") ?? 0);

  if (!PLAN_ORDER.includes(plan as Plan)) return;

  // Paket gratis tidak punya masa berlaku, jadi tanggalnya dibersihkan agar
  // tidak menyisakan tanggal kedaluwarsa yang menyesatkan di UI.
  const expiresAt =
    plan === "FREE" || !Number.isInteger(durationDays) || durationDays <= 0
      ? null
      : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.user.updateMany({
    where: { id },
    data: { plan: plan as Plan, planExpiresAt: expiresAt },
  });

  revalidatePath("/dashboard/admin");
}

/** Naikkan atau turunkan peran seorang pengguna. */
export async function toggleUserRoleAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  // Admin tidak boleh menurunkan dirinya sendiri — instalasi bisa kehilangan
  // admin terakhirnya dan tidak ada cara memulihkannya lewat UI.
  if (id === admin.id) return;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!target) return;

  await prisma.user.update({
    where: { id },
    data: { role: target.role === "ADMIN" ? "USER" : "ADMIN" },
  });

  revalidatePath("/dashboard/admin");
}

/**
 * Hapus seorang pengguna beserta seluruh datanya.
 *
 * Kunci provider dan API key miliknya ikut terhapus lewat `onDelete: Cascade`,
 * sehingga kunci yang sudah dicabut tidak tertinggal di Provider Publik.
 */
export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (id === admin.id) return;

  await prisma.user.deleteMany({ where: { id } });
  revalidatePath("/dashboard/admin");
}

/* -------------------------------------------------------------------------- */
/* Katalog penyedia                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Daftarkan penyedia AI baru ke katalog.
 *
 * Begitu tersimpan, penyedia langsung muncul di halaman depan, dokumentasi,
 * dan formulir pendaftaran kunci — tanpa deploy ulang.
 */
export async function createCustomProviderAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  const label = String(formData.get("label") ?? "").trim();
  const baseUrl = String(formData.get("baseUrl") ?? "").trim();
  const defaultModel = String(formData.get("defaultModel") ?? "").trim();
  const format = String(formData.get("format") ?? "openai");
  const consoleUrl = String(formData.get("consoleUrl") ?? "").trim();
  const free = formData.get("free") === "on";

  if (!slug || !label || !baseUrl || !defaultModel) return;
  if (!/^https:\/\//i.test(baseUrl)) return;
  if (!["openai", "gemini", "anthropic"].includes(format)) return;

  await prisma.customProvider.upsert({
    where: { slug },
    create: {
      slug,
      label,
      baseUrl,
      defaultModel,
      format,
      consoleUrl: consoleUrl || null,
      free,
    },
    update: {
      label,
      baseUrl,
      defaultModel,
      format,
      consoleUrl: consoleUrl || null,
      free,
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/providers");
  revalidatePath("/");
  revalidatePath("/docs");
}

export async function deleteCustomProviderAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  // Kunci yang sudah terlanjur memakai penyedia ini tetap hidup karena
  // baseUrl dan modelName disalin ke barisnya sendiri saat didaftarkan.
  await prisma.customProvider.deleteMany({ where: { id } });

  revalidatePath("/dashboard/admin");
  revalidatePath("/");
  revalidatePath("/docs");
}
