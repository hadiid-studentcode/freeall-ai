import { createHash } from "node:crypto";

import type { PaymentStatus } from "@/generated/prisma/enums";
import type { MidtransCredentials } from "@/lib/payments/config";

/**
 * Klien Midtrans Snap.
 *
 * Dipakai jalur redirect, bukan popup: popup mengharuskan memuat `snap.js`
 * dari domain Midtrans, yang berarti melonggarkan `script-src` pada CSP di
 * setiap halaman yang menyentuh pembayaran. Redirect tidak menuntut itu dan
 * tetap berjalan meski JavaScript gagal dimuat.
 */

const SNAP_BASE = {
  sandbox: "https://app.sandbox.midtrans.com",
  production: "https://app.midtrans.com",
} as const;

const REQUEST_TIMEOUT_MS = 20_000;

function snapUrl(credentials: MidtransCredentials, path: string): string {
  const base = credentials.isProduction ? SNAP_BASE.production : SNAP_BASE.sandbox;
  return `${base}${path}`;
}

/** Midtrans memakai Basic auth dengan server key sebagai username, sandi kosong. */
function authHeader(credentials: MidtransCredentials): string {
  return `Basic ${Buffer.from(`${credentials.serverKey}:`).toString("base64")}`;
}

export interface SnapOrder {
  orderId: string;
  amount: number;
  itemName: string;
  customerName: string;
  customerEmail: string;
  /** Ke mana pembeli dikembalikan setelah selesai di halaman Midtrans. */
  finishUrl: string;
  /** Kapan tagihan hangus, dalam menit sejak dibuat. */
  expiryMinutes: number;
}

export type SnapResult =
  | { ok: true; token: string; redirectUrl: string }
  | { ok: false; error: string };

export async function createSnapTransaction(
  credentials: MidtransCredentials,
  order: SnapOrder,
): Promise<SnapResult> {
  const body = {
    transaction_details: {
      order_id: order.orderId,
      // Midtrans menolak nilai pecahan, jadi dibulatkan di sini agar
      // kegagalannya tidak muncul sebagai error API yang tidak jelas.
      gross_amount: Math.round(order.amount),
    },
    item_details: [
      {
        id: order.orderId,
        name: order.itemName.slice(0, 50),
        price: Math.round(order.amount),
        quantity: 1,
      },
    ],
    customer_details: {
      first_name: order.customerName.slice(0, 50) || "Pelanggan",
      email: order.customerEmail,
    },
    callbacks: { finish: order.finishUrl },
    expiry: { unit: "minute", duration: order.expiryMinutes },
  };

  try {
    const response = await fetch(snapUrl(credentials, "/snap/v1/transactions"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader(credentials),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = JSON.parse(text);
    } catch {
      // Balasan bukan JSON — teks mentahnya lebih berguna daripada pesan generik.
    }

    if (!response.ok) {
      const detail =
        payload &&
        typeof payload === "object" &&
        "error_messages" in payload &&
        Array.isArray((payload as { error_messages: unknown }).error_messages)
          ? (payload as { error_messages: string[] }).error_messages.join("; ")
          : text.slice(0, 300);

      return { ok: false, error: `Midtrans HTTP ${response.status}: ${detail}` };
    }

    const parsed = payload as { token?: string; redirect_url?: string } | null;
    if (!parsed?.token || !parsed.redirect_url) {
      return { ok: false, error: "Midtrans tidak mengembalikan token Snap." };
    }

    return { ok: true, token: parsed.token, redirectUrl: parsed.redirect_url };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Permintaan ke Midtrans gagal.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Notifikasi                                                                 */
/* -------------------------------------------------------------------------- */

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  [key: string]: unknown;
}

/**
 * Apakah notifikasi ini benar-benar datang dari Midtrans.
 *
 * Endpoint webhook terbuka untuk umum, jadi tanpa pemeriksaan ini siapa pun
 * yang menebak sebuah order id bisa mengaktifkan paket berbayar untuk dirinya
 * sendiri. Rumusnya dari dokumentasi Midtrans: SHA-512 atas gabungan order id,
 * kode status, jumlah, dan server key.
 */
export function verifyNotificationSignature(
  notification: Pick<
    MidtransNotification,
    "order_id" | "status_code" | "gross_amount" | "signature_key"
  >,
  serverKey: string,
): boolean {
  const expected = createHash("sha512")
    .update(
      `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`,
      "utf8",
    )
    .digest("hex");

  const received = notification.signature_key ?? "";
  // Panjang berbeda berarti sudah pasti tidak cocok; membandingkannya langsung
  // menghindari kebutuhan menyamakan panjang buffer sebelum timingSafeEqual.
  if (received.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Status yang bisa muncul dari Midtrans. `AWAITING_REVIEW` tidak termasuk —
 * itu milik jalur transfer manual, yang tidak pernah lewat sini.
 */
export type MidtransMappedStatus = Exclude<PaymentStatus, "AWAITING_REVIEW">;

/**
 * Terjemahkan status Midtrans ke status tagihan kita.
 *
 * `capture` dengan `fraud_status: challenge` sengaja tidak dianggap lunas:
 * transaksinya masih menunggu keputusan manual di dashboard Midtrans, dan
 * mengaktifkan paket lebih dulu berarti memberi layanan atas uang yang masih
 * bisa dibatalkan.
 */
export function mapTransactionStatus(
  transactionStatus: string,
  fraudStatus?: string,
): MidtransMappedStatus {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "accept" ? "PAID" : "PENDING";
    case "settlement":
      return "PAID";
    case "pending":
      return "PENDING";
    case "deny":
    case "failure":
      return "FAILED";
    case "cancel":
      return "CANCELLED";
    case "expire":
      return "EXPIRED";
    default:
      return "PENDING";
  }
}
