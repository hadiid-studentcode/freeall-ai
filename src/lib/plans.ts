import type { Plan, Role } from "@/generated/prisma/enums";

/**
 * Definisi paket langganan — satu sumber kebenaran.
 *
 * Yang dijual bukan perangkat lunaknya (kode tetap bisa di-self-host), melainkan
 * layanan terkelola: kuota dari kunci milik operator, riwayat yang disimpan
 * lebih lama, dan kapasitas yang lebih longgar. Karena itu batas-batas di sini
 * berkisar pada hal yang memang menimbulkan biaya bagi operator.
 *
 * Fitur inti — fallback, deteksi otomatis penyedia, enkripsi kunci — sengaja
 * TIDAK dibatasi. Melumpuhkannya di paket gratis hanya membuat orang memilih
 * self-host, dan justru menghilangkan calon pelanggan.
 */

export interface PlanLimits {
  id: Plan;
  label: string;
  /** Harga per bulan dalam rupiah. 0 = gratis. */
  pricePerMonth: number;
  tagline: string;
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
  features: string[];
}

export const PLANS: Record<Plan, PlanLimits> = {
  FREE: {
    id: "FREE",
    label: "Gratis",
    pricePerMonth: 0,
    tagline: "Untuk mencoba dan proyek pribadi.",
    maxApiKeys: 2,
    publicDailyLimit: 50,
    logRetentionDays: 7,
    burstPerMinute: 20,
    features: [
      "Bawa API key sendiri tanpa batas jumlah",
      "Fallback antar model dan kunci",
      "Deteksi penyedia otomatis",
      "Riwayat 7 hari terakhir",
    ],
  },
  PRO: {
    id: "PRO",
    label: "Pro",
    pricePerMonth: 49_000,
    tagline: "Untuk aplikasi yang sudah dipakai orang.",
    maxApiKeys: 10,
    publicDailyLimit: 2_000,
    logRetentionDays: 90,
    burstPerMinute: 60,
    highlight: true,
    features: [
      "Semua yang ada di paket Gratis",
      "2.000 request/hari dari Provider Publik",
      "10 API key untuk memisahkan tiap aplikasi",
      "Riwayat 90 hari",
      "Batas lonjakan 3× lebih longgar",
    ],
  },
  TEAM: {
    id: "TEAM",
    label: "Team",
    pricePerMonth: 199_000,
    tagline: "Untuk tim yang butuh kapasitas dan jejak audit.",
    maxApiKeys: 50,
    publicDailyLimit: 10_000,
    logRetentionDays: 365,
    burstPerMinute: 120,
    features: [
      "Semua yang ada di paket Pro",
      "10.000 request/hari dari Provider Publik",
      "50 API key",
      "Riwayat 1 tahun untuk keperluan audit",
      "Dukungan prioritas",
    ],
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
  label: "Admin",
  pricePerMonth: 0,
  tagline: "Akses penuh sebagai pengelola instance.",
  // Angka besar tapi terbatas, bukan Infinity — supaya tetap aman dipakai
  // pada perhitungan persentase dan atribut `max` di formulir.
  maxApiKeys: 1_000,
  publicDailyLimit: 1_000_000,
  logRetentionDays: 3_650,
  burstPerMinute: 600,
  features: ["Tanpa batas paket", "Kelola Provider Publik", "Kelola pengguna"],
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
