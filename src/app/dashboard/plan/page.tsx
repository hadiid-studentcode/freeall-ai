import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Gauge,
  KeyRound,
  ScrollText,
  Sparkles,
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
import { formatPrice, PLAN_ORDER, PLANS, resolvePlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { getPublicDailyLimit } from "@/lib/settings";
import { formatDateTime, formatNumber } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: `${t.dash.plan.title} · FreeAll AI` };
}

export default async function PlanPage() {
  const user = await requireUser();
  const { t } = await getTranslations();
  const d = t.dash.plan;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [account, apiKeyCount, ownProviderKeys, requestsToday, adminLimit] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { plan: true, planExpiresAt: true, role: true },
      }),
      prisma.apiKey.count({ where: { userId: user.id } }),
      prisma.providerKey.count({ where: { userId: user.id, isActive: true } }),
      prisma.requestLog.count({
        where: { apiKey: { userId: user.id }, createdAt: { gte: startOfDay } },
      }),
      getPublicDailyLimit(),
    ]);

  const plan = resolvePlan(account);
  // Angka batas dari plans.ts; nama dan taglinenya dari kamus bahasa.
  const copy =
    account.role === "ADMIN"
      ? { label: d.adminLabel, tagline: d.adminTagline }
      : t.plans[plan.id];
  const isPaid = plan.pricePerMonth > 0;

  // Kuota publik hanya menggigit kalau user belum membawa kunci sendiri.
  const usesPublicPool = ownProviderKeys === 0;
  const effectivePublicLimit = Math.min(adminLimit, plan.publicDailyLimit);

  // Langganan yang tinggal hitungan hari perlu ditonjolkan, bukan disembunyikan
  // di baris kecil — pengguna berhak tahu sebelum layanannya turun sendiri.
  const now = startOfDay.getTime();
  const daysLeft = account.planExpiresAt
    ? Math.ceil(
        (account.planExpiresAt.getTime() - now) / (24 * 60 * 60 * 1000),
      )
    : null;
  const expiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {d.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {d.subtitle}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pricing">
            {d.compare}
            <ArrowRight />
          </Link>
        </Button>
      </header>

      {expiringSoon && (
        <Alert variant="warning">
          <Clock />
          <AlertDescription>
            {d.expiring(daysLeft ?? 0, formatDateTime(account.planExpiresAt))}
          </AlertDescription>
        </Alert>
      )}

      {/* Paket aktif */}
      <Card className={isPaid ? "border-primary/40" : undefined}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="size-5" />
              </span>
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {d.planPrefix} {copy.label}
                  {isPaid && <Badge>{d.activeBadge}</Badge>}
                </CardTitle>
                <CardDescription>{copy.tagline}</CardDescription>
              </div>
            </div>
            <p className="text-right">
              <span className="text-2xl font-semibold tabular-nums">
                {formatPrice(plan.pricePerMonth)}
              </span>
              {isPaid && (
                <span className="text-sm text-muted-foreground"> {d.perMonth}</span>
              )}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Meter
              icon={<KeyRound className="size-4" />}
              label={d.meterApiKeys}
              used={apiKeyCount}
              limit={plan.maxApiKeys}
              hint={d.meterApiKeysHint(
                formatNumber(apiKeyCount),
                formatNumber(plan.maxApiKeys),
              )}
            />
            <Meter
              icon={<Gauge className="size-4" />}
              label={d.meterPublic}
              used={usesPublicPool ? requestsToday : 0}
              limit={effectivePublicLimit}
              hint={
                usesPublicPool
                  ? d.meterApiKeysHint(
                      formatNumber(requestsToday),
                      formatNumber(effectivePublicLimit),
                    )
                  : d.meterPublicNa
              }
              inactive={!usesPublicPool}
            />
          </div>

          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <Fact
              icon={<ScrollText className="size-4" />}
              label={d.factHistory}
              value={`${formatNumber(plan.logRetentionDays)} ${d.days}`}
            />
            <Fact
              icon={<Gauge className="size-4" />}
              label={d.factBurst}
              value={`${formatNumber(plan.burstPerMinute)} ${d.perMinute}`}
            />
          </div>

          {usesPublicPool ? (
            <Alert>
              <TriangleAlert />
              <AlertDescription>
                {d.usingPoolPre} <strong>{d.usingPoolBold}</strong>{" "}
                {d.usingPoolMid}{" "}
                <Link
                  href="/dashboard/providers"
                  className="font-medium underline underline-offset-4"
                >
                  {d.usingPoolCta}
                </Link>{" "}
                {d.usingPoolPost}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="success">
              <Check />
              <AlertDescription>
                {d.ownKeysPre(ownProviderKeys)}{" "}
                <strong>{d.ownKeysBold}</strong> {d.ownKeysPost}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Perbandingan paket lain */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          {d.availableTitle}
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const other = PLANS[id];
            const isCurrent = other.id === plan.id;

            return (
              <Card
                key={other.id}
                className={isCurrent ? "border-primary/50" : undefined}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{t.plans[id].label}</CardTitle>
                    {isCurrent && (
                      <Badge variant="secondary">{d.yourPlan}</Badge>
                    )}
                  </div>
                  <p>
                    <span className="text-xl font-semibold tabular-nums">
                      {formatPrice(other.pricePerMonth)}
                    </span>
                    {other.pricePerMonth > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        / bulan
                      </span>
                    )}
                  </p>
                </CardHeader>
                <CardContent className="space-y-1.5 text-xs">
                  <Row
                    label={d.rowPublic}
                    value={`${formatNumber(other.publicDailyLimit)} ${d.perDay}`}
                  />
                  <Row
                    label={d.rowApiKeys}
                    value={formatNumber(other.maxApiKeys)}
                  />
                  <Row
                    label={d.rowHistory}
                    value={`${formatNumber(other.logRetentionDays)} ${d.days}`}
                  />
                  <Row
                    label={d.rowBurst}
                    value={`${formatNumber(other.burstPerMinute)} ${d.perMinute}`}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <Sparkles className="size-5 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            {d.manualNote}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/pricing">{d.seePricing}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Meter({
  icon,
  label,
  used,
  limit,
  hint,
  inactive = false,
}: {
  icon: React.ReactNode;
  label: string;
  used: number;
  limit: number;
  hint: string;
  inactive?: boolean;
}) {
  const pct = limit === 0 ? 100 : Math.min((used / limit) * 100, 100);
  const near = !inactive && pct >= 80;

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm">{hint}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={
            inactive
              ? "h-full bg-muted-foreground/30"
              : near
                ? "h-full bg-warning"
                : "h-full bg-primary"
          }
          style={{ width: `${inactive ? 0 : pct}%` }}
        />
      </div>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
