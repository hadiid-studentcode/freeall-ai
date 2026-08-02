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
import { getTranslations } from "@/lib/i18n";
import { describeDisabledReason } from "@/lib/providers/disabled-reason";
import { resolvePlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatRelative } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: `${t.dash.nav.overview} · FreeAll AI` };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { t } = await getTranslations();
  const d = t.dash.overview;

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
      select: { plan: true, planExpiresAt: true, role: true },
    }),
  ]);

  const plan = resolvePlan(account);
  const planLabel =
    account.role === "ADMIN" ? t.dash.plan.adminLabel : t.plans[plan.id].label;

  const successRate =
    requestsToday === 0
      ? null
      : Math.round((successToday / requestsToday) * 100);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {d.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {d.welcome}
            {user.name ? `, ${user.name}` : ""}. {d.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/plan"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40"
            title={d.planLabel}
          >
            <span className="text-muted-foreground">{d.planLabel}</span>
            <Badge variant={plan.id === "FREE" ? "secondary" : "default"}>
              {planLabel}
            </Badge>
          </Link>
          <Button asChild>
            <Link href="/dashboard/providers">
              {d.addProvider}
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
                {d.noticeWithPool(formatNumber(sharedPoolKeys))}{" "}
                <Link
                  href="/dashboard/providers"
                  className="font-medium underline underline-offset-4"
                >
                  {d.noticeWithPoolCta}
                </Link>{" "}
                {d.noticeWithPoolPost}
              </>
            ) : (
              <>
                {d.noticeEmptyPre}{" "}
                <code className="font-mono text-xs">/api/v1/chat</code>{" "}
                {d.noticeEmptyPost}{" "}
                <Link
                  href="/dashboard/providers"
                  className="font-medium underline underline-offset-4"
                >
                  {d.noticeEmptyCta}
                </Link>{" "}
                {d.noticeEmptyEnd}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Server className="size-4" />}
          label={d.statKeys}
          value={formatNumber(activeProviders)}
          hint={d.statKeysHint(
            formatNumber(activeProviders),
            formatNumber(totalProviders),
            formatNumber(sharedPoolKeys),
          )}
        />
        <StatCard
          icon={<KeyRound className="size-4" />}
          label={d.statApiKeys}
          value={formatNumber(activeApiKeys)}
          hint={d.statApiKeysHint}
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label={d.statRequests}
          value={formatNumber(requestsToday)}
          hint={d.statRequestsHint}
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          label={d.statSuccess}
          value={successRate === null ? "—" : `${successRate}%`}
          hint={
            successRate === null
              ? d.statSuccessNone
              : d.statSuccessHint(
                  formatNumber(successToday),
                  formatNumber(requestsToday),
                )
          }
        />
      </div>

      {disabledProviders.length > 0 && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription className="space-y-1">
            <p className="font-medium">
              {d.disabledTitle(disabledProviders.length)}
            </p>
            <ul className="list-inside list-disc opacity-90">
              {disabledProviders.map((provider) => (
                <li key={provider.id}>
                  <span className="capitalize">{provider.providerName}</span> —{" "}
                  {describeDisabledReason(
                    provider.disabledReason,
                    t.errors.provider,
                  ) ?? d.disabledUnknown}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{d.yourKeys}</CardTitle>
          <CardDescription>
            {d.yourKeysHint}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentProviders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {d.noKeys}
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
                        {provider.isActive ? d.active : d.inactive}
                      </Badge>
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {provider.modelName ?? d.defaultModel}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{d.priority} {provider.priority}</span>
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
