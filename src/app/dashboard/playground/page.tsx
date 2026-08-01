import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { PlaygroundClient } from "@/app/dashboard/playground/playground-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Playground · FreeAll AI" };

export default async function PlaygroundPage() {
  const user = await requireUser();

  const [apiKeyCount, providerRows] = await Promise.all([
    prisma.apiKey.count({ where: { userId: user.id, isActive: true } }),
    // Penyedia yang benar-benar bisa dipakai akun ini: miliknya sendiri
    // ditambah Provider Publik.
    prisma.providerKey.findMany({
      where: {
        isActive: true,
        OR: [{ userId: user.id }, { scope: "SHARED" }],
      },
      select: { providerName: true },
      distinct: ["providerName"],
      orderBy: { providerName: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Playground
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Uji endpoint gateway langsung dari sini — lengkap dengan header
          Authorization, kode status, dan waktu respons yang sebenarnya.
        </p>
      </header>

      {apiKeyCount === 0 && (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertDescription>
            Anda belum punya API key aktif.{" "}
            <Link
              href="/dashboard/api-keys"
              className="font-medium underline underline-offset-4"
            >
              Buat satu di halaman API Key
            </Link>{" "}
            lalu tempel di sini.
          </AlertDescription>
        </Alert>
      )}

      <PlaygroundClient
        providers={providerRows.map((row) => row.providerName)}
      />
    </div>
  );
}
