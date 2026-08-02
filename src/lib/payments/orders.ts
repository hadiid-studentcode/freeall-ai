import { randomBytes } from "node:crypto";

import type { Plan } from "@/generated/prisma/enums";
import { nextExpiry } from "@/lib/payments/billing";
import { prisma } from "@/lib/prisma";

/**
 * Siklus hidup satu tagihan.
 *
 * Pengaktifan paket dikumpulkan di sini, bukan disebar ke webhook dan Server
 * Action masing-masing, supaya hanya ada satu tempat yang boleh mengubah
 * `User.plan` karena pembayaran — dan satu tempat pula yang harus benar.
 */

/** Berapa lama tagihan boleh dibayar sebelum hangus. */
export const ORDER_EXPIRY_MINUTES = 24 * 60;

/**
 * Nomor pesanan.
 *
 * Harus unik seumur akun merchant Midtrans — order id yang terpakai ulang
 * ditolak. Komponen acak dipakai alih-alih nomor urut supaya pesanan orang
 * lain tidak bisa ditebak dari milik sendiri.
 */
export function generateOrderId(): string {
  const stamp = Date.now().toString(36);
  return `FA-${stamp}-${randomBytes(4).toString("hex")}`.toUpperCase();
}

export function orderExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + ORDER_EXPIRY_MINUTES * 60_000);
}

/**
 * Tandai tagihan lunas dan berikan paketnya.
 *
 * Idempoten: Midtrans mengirim ulang notifikasi bila balasan kita tidak 200,
 * dan tanpa penjagaan ini satu pembayaran bisa menambah masa berlaku berkali
 * lipat. Baris yang sudah `PAID` karena itu langsung dilewati, dan penambahan
 * masa berlaku dijalankan dalam satu transaksi bersama perubahan status.
 */
export async function markOrderPaid(input: {
  orderId: string;
  channel?: string | null;
  notification?: unknown;
  reviewedBy?: string | null;
  adminNote?: string | null;
}): Promise<{ applied: boolean; plan?: Plan }> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { orderId: input.orderId },
      select: {
        id: true,
        userId: true,
        plan: true,
        durationDays: true,
        status: true,
      },
    });

    if (!payment) return { applied: false };
    if (payment.status === "PAID") return { applied: false, plan: payment.plan };

    const user = await tx.user.findUnique({
      where: { id: payment.userId },
      select: { planExpiresAt: true },
    });
    if (!user) return { applied: false };

    const now = new Date();

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paidAt: now,
        channel: input.channel ?? undefined,
        lastNotification: (input.notification ?? undefined) as never,
        reviewedBy: input.reviewedBy ?? undefined,
        adminNote: input.adminNote ?? undefined,
        reviewedAt: input.reviewedBy ? now : undefined,
      },
    });

    await tx.user.update({
      where: { id: payment.userId },
      data: {
        plan: payment.plan,
        planExpiresAt: nextExpiry(
          user.planExpiresAt,
          payment.durationDays,
          now,
        ),
      },
    });

    return { applied: true, plan: payment.plan };
  });
}

/**
 * Perbarui tagihan yang belum lunas.
 *
 * Tagihan yang sudah `PAID` tidak pernah diturunkan lagi. Notifikasi Midtrans
 * bisa datang tidak berurutan, dan membiarkan pesan `pending` yang telat
 * mencabut paket yang sudah dibayar adalah kegagalan yang paling merugikan
 * pengguna.
 */
export async function updateUnpaidOrder(input: {
  orderId: string;
  status: "PENDING" | "FAILED" | "EXPIRED" | "CANCELLED";
  channel?: string | null;
  notification?: unknown;
}): Promise<void> {
  await prisma.payment.updateMany({
    where: { orderId: input.orderId, status: { not: "PAID" } },
    data: {
      status: input.status,
      channel: input.channel ?? undefined,
      lastNotification: (input.notification ?? undefined) as never,
    },
  });
}

/**
 * Tagihan yang masih menunggu pembayaran dari seorang pengguna.
 *
 * Dipakai untuk mencegah tumpukan tagihan kembar: kalau masih ada yang hidup,
 * pengguna diarahkan menyelesaikannya alih-alih membuat yang baru.
 */
export async function findOpenOrder(userId: string) {
  return prisma.payment.findFirst({
    where: {
      userId,
      status: { in: ["PENDING", "AWAITING_REVIEW"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Hanguskan tagihan yang lewat tenggat.
 *
 * Dijalankan saat halaman pembayaran dibuka, bukan lewat penjadwal terpisah —
 * instance ini tidak punya worker latar, dan yang paling butuh angka mutakhir
 * memang orang yang sedang melihat halamannya.
 *
 * `AWAITING_REVIEW` sengaja tidak ikut dihanguskan: di sana pembeli sudah
 * mengaku mentransfer dan bolanya ada di admin. Menghapusnya karena tenggat
 * lewat berarti menghilangkan klaim atas uang yang mungkin benar-benar masuk.
 */
export async function expireOverdueOrders(userId?: string): Promise<void> {
  await prisma.payment.updateMany({
    where: {
      ...(userId ? { userId } : {}),
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });
}
