import type { Plan, Role } from "@/generated/prisma/enums";

/**
 * Definisi paket langganan — satu sumber kebenaran.
 *
 * Yang dijual adalah layanan terkelola: kuota dari kunci milik operator,
 * riwayat yang disimpan lebih lama, dan kapasitas yang lebih longgar. Karena
 * itu batas-batas di sini berkisar pada hal yang memang menimbulkan biaya bagi
 * operator.
 *
 * Fitur inti — fallback, deteksi otomatis penyedia, enkripsi kunci — sengaja
 * TIDAK dibatasi. Melumpuhkannya hanya membuat pengguna tidak pernah merasakan
 * nilai produknya, dan calon pelanggan hilang sebelum sempat mengenalnya.
 *
 * Berkas ini hanya memuat angka. Nama paket, tagline, dan daftar fiturnya ada
 * di kamus bahasa (`t.plans`) supaya ikut dwibahasa — menyalinnya ke sini
 * hanya akan menghasilkan dua sumber kebenaran yang diam-diam berbeda.
 */

export interface PlanLimits {
  id: Plan;
  /** Harga per bulan dalam rupiah. 0 = gratis. */
  pricePerMonth: number;
  /** Maksimal API key aktif yang bisa dibuat. */
  maxApiKeys: number;
  /**
   * Kuota harian saat memakai Provider Publik — yaitu kunci milik operator.
   * Batas ini lepas begitu pengguna memakai kunci provider miliknya sendiri,
   * karena biayanya tidak lagi ditanggung operator.
   */
  publicDailyLimit: number;
  /** Berapa hari riwayat request bisa dilihat. */
  logRetentionDays: number;
  /** Batas lonjakan per menit per API key. */
  burstPerMinute: number;
  /** Ditonjolkan di halaman harga. */
  highlight?: boolean;
}

export const PLANS: Record<Plan, PlanLimits> = {
  FREE: {
    id: "FREE",
    pricePerMonth: 0,
    maxApiKeys: 2,
    publicDailyLimit: 50,
    logRetentionDays: 7,
    burstPerMinute: 20,
  },
  PRO: {
    id: "PRO",
    pricePerMonth: 49_000,
    maxApiKeys: 10,
    publicDailyLimit: 2_000,
    logRetentionDays: 90,
    burstPerMinute: 60,
    highlight: true,
  },
  TEAM: {
    id: "TEAM",
    pricePerMonth: 199_000,
    maxApiKeys: 50,
    publicDailyLimit: 10_000,
    logRetentionDays: 365,
    burstPerMinute: 120,
  },
};

export const PLAN_ORDER: Plan[] = ["FREE", "PRO", "TEAM"];

/**
 * Batas untuk admin — praktis tanpa batas.
 *
 * Admin adalah pengelola instance ini, bukan pelanggannya: dia yang
 * menyediakan Provider Publik dan menentukan kuota orang lain, jadi tidak
 * masuk akal kalau dirinya sendiri ikut dibatasi paket. Sengaja TIDAK
 * dimasukkan ke `PLAN_ORDER` agar tidak muncul sebagai paket yang bisa dibeli.
 */
export const ADMIN_PLAN: PlanLimits = {
  id: "TEAM",
  pricePerMonth: 0,
  // Angka besar tapi terbatas, bukan Infinity — supaya tetap aman dipakai
  // pada perhitungan persentase dan atribut `max` di formulir.
  maxApiKeys: 1_000,
  publicDailyLimit: 1_000_000,
  logRetentionDays: 3_650,
  burstPerMinute: 600,
};

/**
 * Paket yang benar-benar berlaku untuk seorang pengguna.
 *
 * Langganan yang sudah lewat masa berlakunya diperlakukan sebagai FREE tanpa
 * perlu proses terjadwal — pengecekan dilakukan saat dibaca, sehingga tidak
 * ada jendela waktu di mana akun kedaluwarsa masih menikmati batas berbayar.
 */
export function resolvePlan(user: {
  plan: Plan;
  planExpiresAt: Date | null;
  role?: Role;
}): PlanLimits {
  // Admin selalu mendapat akses penuh, terlepas dari kolom paketnya.
  if (user.role === "ADMIN") return ADMIN_PLAN;

  if (
    user.plan !== "FREE" &&
    user.planExpiresAt !== null &&
    user.planExpiresAt.getTime() < Date.now()
  ) {
    return PLANS.FREE;
  }
  return PLANS[user.plan];
}

export function formatPrice(amount: number): string {
  if (amount === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
