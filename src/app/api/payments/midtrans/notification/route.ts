import { NextResponse } from "next/server";

import { getMidtransCredentials } from "@/lib/payments/config";
import {
  mapTransactionStatus,
  verifyNotificationSignature,
  type MidtransNotification,
} from "@/lib/payments/midtrans";
import { markOrderPaid, updateUnpaidOrder } from "@/lib/payments/orders";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Webhook notifikasi Midtrans — satu-satunya yang boleh menyatakan lunas.
 *
 * Halaman balik (`callbacks.finish`) tidak dipercaya: pembeli bisa menutupnya
 * sebelum termuat, membukanya dua kali, atau mengarang URL-nya sendiri. Yang
 * dipakai di sini hanya pesan server-ke-server yang tanda tangannya cocok.
 *
 * Endpoint ini terbuka untuk umum — Midtrans memanggilnya tanpa sesi login —
 * sehingga verifikasi tanda tangan adalah satu-satunya pintu masuknya.
 */
export async function POST(request: Request) {
  const credentials = await getMidtransCredentials();
  if (!credentials) {
    // Bukan kesalahan pemanggil, tapi kita memang tidak bisa memverifikasi
    // apa pun tanpa server key. 503 membuat Midtrans mencoba lagi nanti.
    return NextResponse.json(
      { received: false, reason: "midtrans-not-configured" },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | MidtransNotification
    | null;

  if (!body?.order_id || !body.signature_key || !body.transaction_status) {
    return NextResponse.json(
      { received: false, reason: "malformed" },
      { status: 400 },
    );
  }

  if (!verifyNotificationSignature(body, credentials.serverKey)) {
    console.warn(
      "[midtrans] tanda tangan notifikasi tidak cocok untuk order",
      body.order_id,
    );
    return NextResponse.json(
      { received: false, reason: "bad-signature" },
      { status: 401 },
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { orderId: body.order_id },
    select: { id: true, amount: true, method: true },
  });

  // Order id tak dikenal: balas 200 supaya Midtrans berhenti mengulang. Tidak
  // ada yang bisa kita lakukan dengan tagihan yang bukan milik sistem ini.
  if (!payment) {
    return NextResponse.json({ received: true, reason: "unknown-order" });
  }

  // Jumlah yang dikonfirmasi harus sama dengan yang ditagih. Tanda tangan
  // memang sudah mengikat nominal, tapi pemeriksaan ini menahan kasus tagihan
  // yang nominalnya sempat diubah setelah Snap dibuat.
  const notifiedAmount = Math.round(Number(body.gross_amount));
  if (!Number.isFinite(notifiedAmount) || notifiedAmount !== payment.amount) {
    console.warn(
      "[midtrans] nominal notifikasi tidak cocok untuk order",
      body.order_id,
    );
    return NextResponse.json(
      { received: false, reason: "amount-mismatch" },
      { status: 409 },
    );
  }

  const status = mapTransactionStatus(
    body.transaction_status,
    body.fraud_status,
  );
  const channel = typeof body.payment_type === "string" ? body.payment_type : null;

  if (status === "PAID") {
    await markOrderPaid({
      orderId: body.order_id,
      channel,
      notification: body,
    });
  } else {
    await updateUnpaidOrder({
      orderId: body.order_id,
      status,
      channel,
      notification: body,
    });
  }

  return NextResponse.json({ received: true, status });
}
