import { decryptSecret, encryptSecret, previewOf } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

/**
 * Konfigurasi pembayaran.
 *
 * Kredensial Midtrans dicari di environment variable lebih dulu, baru jatuh ke
 * nilai yang admin isi lewat dashboard. Urutannya sengaja begitu: server key
 * bisa dipakai menarik dana, jadi tempat teraman baginya adalah env — di sana
 * ia tidak ikut terbawa kalau database bocor atau ter-dump ke backup. Fallback
 * database tetap disediakan supaya instance yang sudah berjalan bisa
 * dikonfigurasi tanpa deploy ulang, dan nilainya dienkripsi AES-256-GCM.
 */

export const PAYMENT_SETTING_KEYS = {
  mode: "payment_mode",
  manualInstructions: "payment_manual_instructions",
  midtransServerKey: "payment_midtrans_server_key",
  midtransClientKey: "payment_midtrans_client_key",
  midtransProduction: "payment_midtrans_production",
} as const;

/** Jalur pembayaran yang dibuka untuk pengguna. */
export const PAYMENT_MODES = ["OFF", "MANUAL", "MIDTRANS", "BOTH"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

/**
 * Default `MANUAL`, bukan `OFF`.
 *
 * Instance yang baru dipasang belum punya kredensial Midtrans, tetapi tetap
 * harus bisa menerima uang lewat transfer biasa — mematikan seluruh jalur
 * pembayaran secara default hanya membuat fitur ini tampak rusak.
 */
export const DEFAULT_PAYMENT_MODE: PaymentMode = "MANUAL";

function isPaymentMode(value: string | undefined): value is PaymentMode {
  return (PAYMENT_MODES as readonly string[]).includes(value ?? "");
}

async function readSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({
    where: { key },
    select: { value: true },
  });
  return row?.value?.trim() ? row.value : null;
}

async function writeSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getPaymentMode(): Promise<PaymentMode> {
  const value = (await readSetting(PAYMENT_SETTING_KEYS.mode)) ?? undefined;
  return isPaymentMode(value) ? value : DEFAULT_PAYMENT_MODE;
}

export async function setPaymentMode(mode: PaymentMode): Promise<void> {
  await writeSetting(PAYMENT_SETTING_KEYS.mode, mode);
}

/** Petunjuk transfer yang ditampilkan ke pembeli pada jalur manual. */
export async function getManualInstructions(): Promise<string> {
  return (await readSetting(PAYMENT_SETTING_KEYS.manualInstructions)) ?? "";
}

export async function setManualInstructions(text: string): Promise<void> {
  await writeSetting(PAYMENT_SETTING_KEYS.manualInstructions, text.trim());
}

export interface MidtransCredentials {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
  /** Dari mana kredensial ini terbaca — ditampilkan di panel admin. */
  source: "env" | "database";
}

/**
 * Kredensial Midtrans yang berlaku, atau null bila belum lengkap.
 *
 * Server key dan client key harus berasal dari sumber yang sama. Mencampur
 * server key produksi dengan client key sandbox menghasilkan kegagalan yang
 * membingungkan di tengah transaksi, jadi lebih baik dianggap belum siap.
 */
export async function getMidtransCredentials(): Promise<MidtransCredentials | null> {
  const envServer = process.env.MIDTRANS_SERVER_KEY?.trim();
  const envClient = process.env.MIDTRANS_CLIENT_KEY?.trim();

  if (envServer && envClient) {
    return {
      serverKey: envServer,
      clientKey: envClient,
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      source: "env",
    };
  }

  const [encryptedServer, storedClient, production] = await Promise.all([
    readSetting(PAYMENT_SETTING_KEYS.midtransServerKey),
    readSetting(PAYMENT_SETTING_KEYS.midtransClientKey),
    readSetting(PAYMENT_SETTING_KEYS.midtransProduction),
  ]);

  if (!encryptedServer || !storedClient) return null;

  return {
    serverKey: decryptSecret(encryptedServer),
    clientKey: storedClient,
    isProduction: production === "true",
    source: "database",
  };
}

export async function saveMidtransCredentials(input: {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
}): Promise<void> {
  await Promise.all([
    writeSetting(
      PAYMENT_SETTING_KEYS.midtransServerKey,
      encryptSecret(input.serverKey),
    ),
    writeSetting(PAYMENT_SETTING_KEYS.midtransClientKey, input.clientKey),
    writeSetting(
      PAYMENT_SETTING_KEYS.midtransProduction,
      String(input.isProduction),
    ),
  ]);
}

export async function clearMidtransCredentials(): Promise<void> {
  await prisma.setting.deleteMany({
    where: {
      key: {
        in: [
          PAYMENT_SETTING_KEYS.midtransServerKey,
          PAYMENT_SETTING_KEYS.midtransClientKey,
          PAYMENT_SETTING_KEYS.midtransProduction,
        ],
      },
    },
  });
}

/** Ringkasan aman untuk panel admin — server key tidak pernah dikirim utuh. */
export interface MidtransStatus {
  configured: boolean;
  source: "env" | "database" | null;
  isProduction: boolean;
  serverKeyPreview: string | null;
  clientKey: string | null;
}

export async function getMidtransStatus(): Promise<MidtransStatus> {
  const credentials = await getMidtransCredentials();
  if (!credentials) {
    return {
      configured: false,
      source: null,
      isProduction: false,
      serverKeyPreview: null,
      clientKey: null,
    };
  }

  return {
    configured: true,
    source: credentials.source,
    isProduction: credentials.isProduction,
    serverKeyPreview: previewOf(credentials.serverKey),
    // Client key memang dirancang untuk dipakai di peramban, jadi aman ditampilkan.
    clientKey: credentials.clientKey,
  };
}

/**
 * Jalur yang benar-benar bisa dipakai pembeli saat ini.
 *
 * Mode yang dipilih admin belum tentu berarti jalurnya siap: memilih
 * `MIDTRANS` tanpa kredensial hanya akan menghasilkan tombol yang gagal saat
 * diklik. Pemeriksaan digabung di sini supaya UI dan Server Action memakai
 * jawaban yang sama.
 */
export interface AvailableMethods {
  mode: PaymentMode;
  midtrans: boolean;
  manual: boolean;
  any: boolean;
}

export async function getAvailableMethods(): Promise<AvailableMethods> {
  const mode = await getPaymentMode();
  const wantsMidtrans = mode === "MIDTRANS" || mode === "BOTH";
  const midtrans = wantsMidtrans && (await getMidtransCredentials()) !== null;
  const manual = mode === "MANUAL" || mode === "BOTH";

  return { mode, midtrans, manual, any: midtrans || manual };
}
