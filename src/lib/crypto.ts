import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import { getEncryptionKey } from "@/lib/env";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const IV_LENGTH = 12; // Ukuran nonce yang direkomendasikan untuk GCM
const AUTH_TAG_LENGTH = 16;

/* -------------------------------------------------------------------------- */
/* Enkripsi ProviderKey (dua arah — kunci harus bisa dipakai lagi saat request) */
/* -------------------------------------------------------------------------- */

/**
 * Enkripsi AES-256-GCM. Hasilnya `base64(iv | authTag | ciphertext)`.
 *
 * GCM dipilih karena authenticated: ciphertext yang diubah orang lain akan
 * ditolak saat dekripsi, bukan menghasilkan sampah diam-diam.
 */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64",
  );
}

export function decryptSecret(payload: string): string {
  const buffer = Buffer.from(payload, "base64");
  if (buffer.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Ciphertext ProviderKey rusak atau terpotong.");
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // Penyebab paling umum: ENCRYPTION_KEY berganti setelah data tersimpan.
    throw new Error(
      "Gagal mendekripsi ProviderKey. Pastikan ENCRYPTION_KEY masih sama " +
        "dengan saat kunci ini disimpan.",
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Hashing satu arah                                                          */
/* -------------------------------------------------------------------------- */

/** Dipakai untuk lookup & unique constraint pada nilai rahasia. */
export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/* -------------------------------------------------------------------------- */
/* Password                                                                   */
/* -------------------------------------------------------------------------- */

const SCRYPT_KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);

  // Panjang harus dicek dulu: timingSafeEqual melempar kalau ukurannya beda.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* -------------------------------------------------------------------------- */
/* Kunci SaaS & token sesi                                                    */
/* -------------------------------------------------------------------------- */

export const API_KEY_PREFIX = "sk-freeall-";

/** Menghasilkan kunci SaaS baru. Nilai mentahnya hanya ditampilkan sekali. */
export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${randomBytes(24).toString("hex")}`;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Ringkasan aman untuk ditampilkan di UI, mis. `sk-freeall-a1b2…9f2c`.
 * Tidak pernah menampilkan cukup karakter untuk menebak kunci aslinya.
 */
export function previewOf(secret: string): string {
  if (secret.length <= 12) return "…";

  const head = secret.startsWith(API_KEY_PREFIX)
    ? secret.slice(0, API_KEY_PREFIX.length + 4)
    : secret.slice(0, 6);

  return `${head}…${secret.slice(-4)}`;
}
