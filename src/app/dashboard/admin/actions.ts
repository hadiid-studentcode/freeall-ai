"use server";

import { revalidatePath } from "next/cache";

import type { Plan } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth/guard";
import { PLAN_ORDER } from "@/lib/plans";
import { getTranslations } from "@/lib/i18n";
import { assertSafeExternalUrl } from "@/lib/security/url-guard";
import { prisma } from "@/lib/prisma";
import {
  clearMidtransCredentials,
  PAYMENT_MODES,
  saveMidtransCredentials,
  setManualInstructions,
  setPaymentMode,
  type PaymentMode,
} from "@/lib/payments/config";
import { markOrderPaid } from "@/lib/payments/orders";
import {
  setDemoGlobalDailyLimit,
  setPublicDailyLimit,
} from "@/lib/settings";

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

/** Batas total percakapan demo dari seluruh pengunjung dalam sehari. */
export async function updateDemoGlobalLimitAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const limit = Number(formData.get("limit") ?? -1);

  if (!Number.isInteger(limit) || limit < 0 || limit > 1_000_000) return;

  await setDemoGlobalDailyLimit(limit);
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
  if (!["openai", "gemini", "anthropic"].includes(format)) return;
  const { t } = await getTranslations();
  if (!(await assertSafeExternalUrl(baseUrl, t.errors.url)).ok) return;

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

/* -------------------------------------------------------------------------- */
/* Pembayaran                                                                 */
/* -------------------------------------------------------------------------- */

/** Pilih jalur pembayaran yang dibuka untuk pengguna. */
export async function updatePaymentModeAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const mode = String(formData.get("mode") ?? "");

  if (!(PAYMENT_MODES as readonly string[]).includes(mode)) return;

  await setPaymentMode(mode as PaymentMode);
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/plan");
}

/** Petunjuk transfer yang dilihat pembeli pada jalur manual. */
export async function updateManualInstructionsAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  await setManualInstructions(String(formData.get("instructions") ?? ""));

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/plan");
}

/**
 * Simpan kredensial Midtrans ke database.
 *
 * Hanya berlaku bila `MIDTRANS_SERVER_KEY` di environment kosong — env selalu
 * menang, supaya konfigurasi deploy tidak diam-diam ditimpa lewat dashboard.
 */
export async function saveMidtransCredentialsAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const serverKey = String(formData.get("serverKey") ?? "").trim();
  const clientKey = String(formData.get("clientKey") ?? "").trim();
  const isProduction = formData.get("isProduction") === "on";

  if (!serverKey || !clientKey) return;

  await saveMidtransCredentials({ serverKey, clientKey, isProduction });
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/plan");
}

export async function clearMidtransCredentialsAction(): Promise<void> {
  await requireAdmin();
  await clearMidtransCredentials();

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/plan");
}

/**
 * Setujui tagihan transfer manual.
 *
 * Pengaktifan paketnya dilimpahkan ke `markOrderPaid()` — satu-satunya tempat
 * yang boleh menambah masa berlaku karena pembayaran, dipakai bersama webhook
 * Midtrans supaya kedua jalur tidak berbeda perilaku.
 */
export async function approveManualPaymentAction(
  formData: FormData,
): Promise<void> {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const note = String(formData.get("adminNote") ?? "").trim();

  const payment = await prisma.payment.findUnique({
    where: { orderId },
    select: { method: true, status: true },
  });

  // Hanya jalur manual yang boleh disetujui dari sini. Tagihan Midtrans
  // statusnya ditentukan notifikasi mereka; menyetujuinya manual berarti
  // memberi paket atas uang yang belum tentu masuk.
  if (payment?.method !== "MANUAL") return;
  if (payment.status !== "AWAITING_REVIEW" && payment.status !== "PENDING") {
    return;
  }

  await markOrderPaid({
    orderId,
    channel: "manual-transfer",
    reviewedBy: admin.email,
    adminNote: note ? note.slice(0, 500) : null,
  });

  revalidatePath("/dashboard/admin");
}

export async function rejectManualPaymentAction(
  formData: FormData,
): Promise<void> {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const note = String(formData.get("adminNote") ?? "").trim();

  await prisma.payment.updateMany({
    where: { orderId, method: "MANUAL", status: { not: "PAID" } },
    data: {
      status: "FAILED",
      adminNote: note ? note.slice(0, 500) : null,
      reviewedBy: admin.email,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/admin");
}
