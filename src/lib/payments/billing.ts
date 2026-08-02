import type { Plan } from "@/generated/prisma/enums";
import { PLANS } from "@/lib/plans";

/**
 * Siklus penagihan dan cara harganya dihitung.
 *
 * Harga tahunan sengaja dipatok 10× harga bulanan, bukan 12×: dua bulan gratis
 * adalah imbalan yang jelas untuk pembayaran di muka, dan uang masuk lebih awal
 * jauh lebih berharga bagi operator kecil daripada selisih dua bulan itu.
 */

export const BILLING_CYCLES = ["MONTHLY", "YEARLY"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

interface CycleSpec {
  /** Pengali terhadap harga bulanan paket. */
  multiplier: number;
  /** Masa berlaku yang ditambahkan setelah lunas. */
  days: number;
}

const CYCLE_SPECS: Record<BillingCycle, CycleSpec> = {
  MONTHLY: { multiplier: 1, days: 30 },
  YEARLY: { multiplier: 10, days: 365 },
};

export function isBillingCycle(value: string): value is BillingCycle {
  return (BILLING_CYCLES as readonly string[]).includes(value);
}

/** Paket yang benar-benar bisa dibeli — FREE tidak dijual. */
export const PURCHASABLE_PLANS: Plan[] = ["PRO", "TEAM"];

export function isPurchasablePlan(value: string): value is Plan {
  return (PURCHASABLE_PLANS as string[]).includes(value);
}

export interface Quote {
  plan: Plan;
  cycle: BillingCycle;
  /** Rupiah penuh; Midtrans menolak pecahan sen. */
  amount: number;
  durationDays: number;
  /** Berapa yang dihemat dibanding membayar bulanan selama periode yang sama. */
  savings: number;
}

export function quote(plan: Plan, cycle: BillingCycle): Quote {
  const spec = CYCLE_SPECS[cycle];
  const monthly = PLANS[plan].pricePerMonth;
  const amount = monthly * spec.multiplier;
  const months = cycle === "YEARLY" ? 12 : 1;

  return {
    plan,
    cycle,
    amount,
    durationDays: spec.days,
    savings: monthly * months - amount,
  };
}

/**
 * Kapan paket berakhir setelah pembayaran ini lunas.
 *
 * Sisa masa berlaku yang belum terpakai ditambahkan, bukan dibuang. Kalau
 * seseorang memperpanjang seminggu sebelum habis, menghanguskan sisa itu sama
 * saja menagih untuk waktu yang sudah dibayar — dan itu keluhan yang wajar.
 */
export function nextExpiry(
  currentExpiry: Date | null,
  durationDays: number,
  now: Date = new Date(),
): Date {
  const base =
    currentExpiry && currentExpiry.getTime() > now.getTime()
      ? currentExpiry
      : now;

  const next = new Date(base);
  next.setDate(next.getDate() + durationDays);
  return next;
}
