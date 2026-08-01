/**
 * Validasi environment variable yang wajib ada.
 *
 * Prisma v7 tidak lagi memuat `.env` secara otomatis, tapi Next.js tetap
 * memuatnya untuk kode aplikasi. Modul ini memastikan kegagalan konfigurasi
 * muncul sebagai pesan yang jelas, bukan `undefined` yang menjalar entah ke mana.
 */

function required(name: string, hint: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Environment variable ${name} belum diisi.\n${hint}\n` +
        `Salin .env.example menjadi .env lalu lengkapi nilainya.`,
    );
  }
  return value;
}

export function getDatabaseUrl(): string {
  return required(
    "DATABASE_URL",
    'Contoh: DATABASE_URL="postgresql://user:password@localhost:5432/freealldb?schema=public"',
  );
}

/**
 * Kunci AES-256-GCM untuk mengenkripsi ProviderKey.
 *
 * PERINGATAN: kalau kunci ini hilang atau berubah, seluruh ProviderKey yang
 * sudah tersimpan tidak bisa didekripsi lagi dan harus dimasukkan ulang.
 */
export function getEncryptionKey(): Buffer {
  const raw = required(
    "ENCRYPTION_KEY",
    "Generate dengan: openssl rand -base64 32",
  );

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY harus 32 byte setelah di-decode base64, ` +
        `tetapi hasilnya ${key.length} byte. Generate ulang dengan: openssl rand -base64 32`,
    );
  }
  return key;
}

export const isProduction = process.env.NODE_ENV === "production";
