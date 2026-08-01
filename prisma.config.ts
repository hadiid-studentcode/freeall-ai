// Konfigurasi Prisma CLI (standar v7).
// Env tidak lagi dimuat otomatis oleh Prisma, jadi dotenv di-import manual.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    // Dipakai `migrate dev` / `migrate diff` untuk memutar ulang migrasi di DB sementara.
    // Kosongkan bila user database tidak punya hak CREATE DATABASE.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
