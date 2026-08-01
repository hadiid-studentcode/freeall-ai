import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseUrl, isProduction } from "@/lib/env";

// Prisma v7 memerlukan driver adapter untuk semua provider SQL — tidak ada lagi
// engine biner bawaan. `pg` yang bicara ke PostgreSQL, Prisma hanya melapisinya.
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
    connectionTimeoutMillis: 5_000,
  });

  return new PrismaClient({
    adapter,
    log: isProduction ? ["error"] : ["error", "warn"],
  });
}

// Next.js dev mem-reload modul setiap perubahan file. Tanpa singleton di
// globalThis, tiap reload membuka pool koneksi baru sampai PostgreSQL menolak.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
