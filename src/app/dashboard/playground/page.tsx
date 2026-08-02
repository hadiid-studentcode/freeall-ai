import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { PlaygroundClient } from "@/app/dashboard/playground/playground-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireUser } from "@/lib/auth/guard";
import { getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: `${t.dash.playground.title} · FreeAll AI` };
}

export default async function PlaygroundPage() {
  const user = await requireUser();
  const { t } = await getTranslations();
  const d = t.dash.playground;

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
          {d.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {d.subtitle}
        </p>
      </header>

      {apiKeyCount === 0 && (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertDescription>
            {d.noKeyPre}{" "}
            <Link
              href="/dashboard/api-keys"
              className="font-medium underline underline-offset-4"
            >
              {d.noKeyCta}
            </Link>{" "}
            {d.noKeyPost}
          </AlertDescription>
        </Alert>
      )}

      <PlaygroundClient
        providers={providerRows.map((row) => row.providerName)}
        t={d}
      />
    </div>
  );
}
