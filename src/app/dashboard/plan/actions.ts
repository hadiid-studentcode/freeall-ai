"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/guard";
import { getTranslations } from "@/lib/i18n";
import {
  isBillingCycle,
  isPurchasablePlan,
  quote,
  type BillingCycle,
} from "@/lib/payments/billing";
import {
  getAvailableMethods,
  getMidtransCredentials,
} from "@/lib/payments/config";
import { createSnapTransaction } from "@/lib/payments/midtrans";
import {
  ORDER_EXPIRY_MINUTES,
  expireOverdueOrders,
  findOpenOrder,
  generateOrderId,
  orderExpiry,
} from "@/lib/payments/orders";
import { prisma } from "@/lib/prisma";

/**
 * Aksi pembelian paket.
 *
 * Seperti Server Action lain di aplikasi ini, tiap fungsi memanggil
 * `requireUser()` sendiri dan memfilter dengan `userId` — Server Action bisa
 * dipanggil lewat POST langsung tanpa melewati halaman mana pun.
 *
 * Harga TIDAK PERNAH diambil dari formulir. Yang dikirim klien hanya paket dan
 * siklusnya; nominalnya dihitung ulang di server. Kalau tidak, siapa pun bisa
 * membeli paket Team seharga seribu rupiah dengan mengubah satu input.
 */

export interface CheckoutState {
  error?: string;
  success?: string;
  /** Diisi saat Snap siap; klien mengarahkan pembeli ke sini. */
  redirectUrl?: string;
}

/** URL absolut instance ini — Midtrans butuh alamat penuh untuk callback. */
async function appOrigin(): Promise<string> {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host");
  const proto = store.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host ?? "localhost:3000"}`;
}

function readOrderForm(formData: FormData) {
  const plan = String(formData.get("plan") ?? "");
  const cycle = String(formData.get("cycle") ?? "");
  return {
    plan: isPurchasablePlan(plan) ? plan : null,
    cycle: isBillingCycle(cycle) ? (cycle as BillingCycle) : null,
  };
}

export async function startMidtransCheckoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await requireUser();
  const { t } = await getTranslations();
  const e = t.errors.billing;

  const { plan, cycle } = readOrderForm(formData);
  if (!plan || !cycle) return { error: e.invalidSelection };

  const methods = await getAvailableMethods();
  if (!methods.midtrans) return { error: e.midtransUnavailable };

  const credentials = await getMidtransCredentials();
  if (!credentials) return { error: e.midtransUnavailable };

  await expireOverdueOrders(user.id);
  const open = await findOpenOrder(user.id);
  if (open) return { error: e.orderAlreadyOpen(open.orderId) };

  const price = quote(plan, cycle);
  const orderId = generateOrderId();
  const origin = await appOrigin();

  // Tagihan dicatat sebelum memanggil Midtrans. Kalau urutannya dibalik dan
  // penulisan gagal, transaksi sudah terlanjur ada di sisi mereka tanpa
  // padanan di sini — dan notifikasinya nanti tidak bisa dicocokkan.
  await prisma.payment.create({
    data: {
      orderId,
      userId: user.id,
      plan,
      durationDays: price.durationDays,
      amount: price.amount,
      method: "MIDTRANS",
      status: "PENDING",
      expiresAt: orderExpiry(),
    },
  });

  const snap = await createSnapTransaction(credentials, {
    orderId,
    amount: price.amount,
    itemName: `FreeAll AI ${plan} ${cycle}`,
    customerName: user.name ?? user.email.split("@")[0],
    customerEmail: user.email,
    finishUrl: `${origin}/dashboard/plan?order=${orderId}`,
    expiryMinutes: ORDER_EXPIRY_MINUTES,
  });

  if (!snap.ok) {
    await prisma.payment.updateMany({
      where: { orderId, userId: user.id },
      data: { status: "FAILED", adminNote: snap.error.slice(0, 500) },
    });
    return { error: e.midtransFailed(snap.error) };
  }

  await prisma.payment.updateMany({
    where: { orderId, userId: user.id },
    data: { snapToken: snap.token, snapRedirectUrl: snap.redirectUrl },
  });

  revalidatePath("/dashboard/plan");
  return { redirectUrl: snap.redirectUrl };
}

/**
 * Buat tagihan transfer manual.
 *
 * Tidak ada yang aktif di sini — pesanan hanya masuk antrean admin. Yang
 * mengaktifkan paket tetap manusia yang memeriksa mutasi rekening.
 */
export async function startManualOrderAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await requireUser();
  const { t } = await getTranslations();
  const e = t.errors.billing;

  const { plan, cycle } = readOrderForm(formData);
  if (!plan || !cycle) return { error: e.invalidSelection };

  const methods = await getAvailableMethods();
  if (!methods.manual) return { error: e.manualUnavailable };

  await expireOverdueOrders(user.id);
  const open = await findOpenOrder(user.id);
  if (open) return { error: e.orderAlreadyOpen(open.orderId) };

  const price = quote(plan, cycle);

  await prisma.payment.create({
    data: {
      orderId: generateOrderId(),
      userId: user.id,
      plan,
      durationDays: price.durationDays,
      amount: price.amount,
      method: "MANUAL",
      status: "PENDING",
      expiresAt: orderExpiry(),
    },
  });

  revalidatePath("/dashboard/plan");
  return { success: e.manualCreated };
}

/** Pembeli mengaku sudah mentransfer; tagihan pindah ke antrean admin. */
export async function submitManualProofAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await requireUser();
  const { t } = await getTranslations();
  const e = t.errors.billing;

  const orderId = String(formData.get("orderId") ?? "");
  const note = String(formData.get("payerNote") ?? "").trim();

  if (note.length < 4) return { error: e.proofTooShort };

  const updated = await prisma.payment.updateMany({
    where: {
      orderId,
      userId: user.id,
      method: "MANUAL",
      status: "PENDING",
    },
    data: { status: "AWAITING_REVIEW", payerNote: note.slice(0, 500) },
  });

  if (updated.count === 0) return { error: e.orderNotFound };

  revalidatePath("/dashboard/plan");
  return { success: e.proofSubmitted };
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");

  // Tagihan yang sudah masuk antrean admin tidak bisa dibatalkan sendiri:
  // uangnya mungkin sudah dikirim, dan pembatalannya harus diketahui admin.
  await prisma.payment.updateMany({
    where: { orderId, userId: user.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/dashboard/plan");
}
