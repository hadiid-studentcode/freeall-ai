/**
 * Seed opsional: membuat satu akun admin untuk memulai.
 *
 * Sengaja TIDAK menanam ProviderKey apa pun — kunci penyedia harus dimasukkan
 * lewat dashboard agar terenkripsi dengan ENCRYPTION_KEY milik instalasi ini.
 *
 * Skrip ini dijalankan Node secara langsung, di luar Next.js, sehingga alias
 * `@/` tidak tersedia. Hashing password karena itu ditulis ulang di sini —
 * formatnya harus tetap sama persis dengan `hashPassword` di src/lib/crypto.ts.
 *
 * Jalankan: npm run db:seed
 */
import "dotenv/config";

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.ts";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@freeall.local";
const password = process.env.SEED_ADMIN_PASSWORD ?? "freeall123";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Akun ${email} sudah ada — seed dilewati.`);
      return;
    }

    await prisma.user.create({
      data: {
        email,
        name: "Admin",
        passwordHash: await hashPassword(password),
        role: "ADMIN",
      },
    });

    console.log(`Akun admin dibuat: ${email} / ${password}`);
    console.log("Segera ganti kata sandinya setelah login pertama.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
