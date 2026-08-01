import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Server,
  TriangleAlert,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guard";
import { resolvePlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatRelative } from "@/lib/utils";

export const metadata = { title: "Ringkasan · FreeAll AI" };

export default async function DashboardPage() {
  const user = await requireUser();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    activeProviders,
    totalProviders,
    activeApiKeys,
    requestsToday,
    successToday,
    disabledProviders,
    recentProviders,
    sharedPoolKeys,
    account,
  ] = await Promise.all([
    // Semua angka di halaman ini HANYA milik akun yang sedang login.
    // Kunci provider adalah data pribadi: berapa yang dipunyai orang lain,
    // penyedia apa, dan seberapa sering dipakai bukan urusan user lain.
    // Angka lintas-akun hanya ada di /dashboard/admin.
    prisma.providerKey.count({ where: { userId: user.id, isActive: true } }),
    prisma.providerKey.count({ where: { userId: user.id } }),
    prisma.apiKey.count({ where: { userId: user.id, isActive: true } }),
    prisma.requestLog.count({
      where: { createdAt: { gte: startOfDay }, apiKey: { userId: user.id } },
    }),
    prisma.requestLog.count({
      where: {
        createdAt: { gte: startOfDay },
        success: true,
        apiKey: { userId: user.id },
      },
    }),
    prisma.providerKey.findMany({
      where: { userId: user.id, isActive: false },
      select: { id: true, providerName: true, disabledReason: true },
      take: 5,
    }),
    prisma.providerKey.findMany({
      where: { userId: user.id },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        providerName: true,
        modelName: true,
        isActive: true,
        priority: true,
        successCount: true,
        errorCount: true,
        lastUsedAt: true,
      },
    }),
    // Hanya jumlahnya, tanpa detail apa pun. Ini bukan data pribadi orang
    // lain melainkan kemampuan yang memang dimiliki akun ini: kalau kunci
    // sendiri habis, request masih bisa dilayani Provider Publik.
    prisma.providerKey.count({
      where: { isActive: true, scope: "SHARED", userId: { not: user.id } },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { plan: true, planExpiresAt: true },
    }),
  ]);

  const plan = resolvePlan(account);

  const successRate =
    requestsToday === 0
      ? null
      : Math.round((successToday / requestsToday) * 100);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ringkasan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selamat datang kembali{user.name ? `, ${user.name}` : ""}. Berikut
            kondisi gateway Anda hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40"
            title="Lihat paket dan batasnya"
          >
            <span className="text-muted-foreground">Paket</span>
            <Badge variant={plan.id === "FREE" ? "secondary" : "default"}>
              {plan.label}
            </Badge>
          </Link>
          <Button asChild>
            <Link href="/dashboard/providers">
              Tambah provider
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      {totalProviders === 0 && (
        <Alert variant={sharedPoolKeys > 0 ? "default" : "warning"}>
          <TriangleAlert />
          <AlertDescription>
            {sharedPoolKeys > 0 ? (
              <>
                Anda belum menambahkan kunci provider sendiri. Request tetap
                dilayani {formatNumber(sharedPoolKeys)} kunci dari Provider Publik,
                tetapi kuotanya dipakai bergantian dengan pengguna lain.{" "}
                <Link
                  href="/dashboard/providers"
                  className="font-medium underline underline-offset-4"
                >
                  Tambahkan kunci sendiri
                </Link>{" "}
                agar kuotanya jadi milik Anda sepenuhnya.
              </>
            ) : (
              <>
                Belum ada kunci provider yang bisa dipakai akun ini, jadi{" "}
                <code className="font-mono text-xs">/api/v1/chat</code> masih
                akan membalas 503.{" "}
                <Link
                  href="/dashboard/providers"
                  className="font-medium underline underline-offset-4"
                >
                  Tambahkan minimal satu kunci provider
                </Link>{" "}
                untuk mengaktifkannya.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Server className="size-4" />}
          label="Kunci provider Anda"
          value={formatNumber(activeProviders)}
          hint={
            sharedPoolKeys > 0
              ? `aktif dari ${formatNumber(totalProviders)} · +${formatNumber(sharedPoolKeys)} dari Provider Publik`
              : `aktif dari ${formatNumber(totalProviders)} kunci Anda`
          }
        />
        <StatCard
          icon={<KeyRound className="size-4" />}
          label="API key aktif"
          value={formatNumber(activeApiKeys)}
          hint="milik akun Anda"
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="Request hari ini"
          value={formatNumber(requestsToday)}
          hint="lewat API key Anda"
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          label="Tingkat sukses"
          value={successRate === null ? "—" : `${successRate}%`}
          hint={
            successRate === null
              ? "belum ada request hari ini"
              : `${formatNumber(successToday)} dari ${formatNumber(requestsToday)} berhasil`
          }
        />
      </div>

      {disabledProviders.length > 0 && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription className="space-y-1">
            <p className="font-medium">
              {disabledProviders.length} kunci provider Anda sedang nonaktif.
            </p>
            <ul className="list-inside list-disc opacity-90">
              {disabledProviders.map((provider) => (
                <li key={provider.id}>
                  <span className="capitalize">{provider.providerName}</span> —{" "}
                  {provider.disabledReason ?? "alasan tidak tercatat"}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kunci provider Anda</CardTitle>
          <CardDescription>
            Diurutkan sesuai prioritas eksekusi — yang paling atas dicoba lebih
            dulu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentProviders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Anda belum menyumbang kunci provider apa pun.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentProviders.map((provider) => (
                <li
                  key={provider.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium capitalize">
                      {provider.providerName}
                      <Badge
                        variant={provider.isActive ? "success" : "destructive"}
                      >
                        {provider.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {provider.modelName ?? "model bawaan preset"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Prioritas {provider.priority}</span>
                    <span className="text-success">
                      ✓ {formatNumber(provider.successCount)}
                    </span>
                    <span className="text-destructive">
                      ✕ {formatNumber(provider.errorCount)}
                    </span>
                    <span className="hidden sm:inline">
                      {formatRelative(provider.lastUsedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
