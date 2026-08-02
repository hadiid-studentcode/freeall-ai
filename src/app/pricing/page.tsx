import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Heart, Server } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPrice, PLAN_ORDER, PLANS, resolvePlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t.home.metaPricingTitle, description: t.home.metaPricingDesc };
}


export default async function PricingPage() {
  const { locale, t } = await getTranslations();

  const user = await getCurrentUser();

  const account = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { plan: true, planExpiresAt: true, role: true },
      })
    : null;
  const currentPlan = account ? resolvePlan(account) : null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              className="hidden px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t.common.docs}
            </Link>
            <LanguageSwitcher current={locale} />
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href={user ? "/dashboard" : "/register"}>
                {user ? t.common.dashboard : t.common.register}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline">{t.pricing.eyebrow}</Badge>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.pricing.title}
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id];
            // Angka batas dari plans.ts; nama dan fiturnya dari kamus bahasa.
            const copy = t.plans[id];
            const isCurrent = currentPlan?.id === plan.id;

            return (
              <Card
                key={plan.id}
                className={
                  plan.highlight
                    ? "relative border-primary/50 shadow-lg shadow-primary/5"
                    : "relative"
                }
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>{t.pricing.mostPicked}</Badge>
                  </span>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-xl">{copy.label}</CardTitle>
                    {isCurrent && (
                      <Badge variant="secondary">{t.pricing.yourPlan}</Badge>
                    )}
                  </div>
                  <CardDescription>{copy.tagline}</CardDescription>
                  <p className="pt-3">
                    <span className="text-3xl font-semibold tabular-nums">
                      {plan.pricePerMonth === 0
                        ? t.pricing.freeLabel
                        : formatPrice(plan.pricePerMonth)}
                    </span>
                    {plan.pricePerMonth > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        {t.pricing.perMonth}
                      </span>
                    )}
                  </p>
                </CardHeader>

                <CardContent className="space-y-5">
                  <ul className="space-y-2.5">
                    {copy.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="space-y-1.5 border-t border-border pt-4 text-xs">
                    <Row
                      label={t.pricing.rowPublicQuota}
                      value={`${formatNumber(plan.publicDailyLimit)} ${t.pricing.perDay}`}
                    />
                    <Row
                      label={t.pricing.rowApiKeys}
                      value={formatNumber(plan.maxApiKeys)}
                    />
                    <Row
                      label={t.pricing.rowHistory}
                      value={`${formatNumber(plan.logRetentionDays)} ${t.pricing.days}`}
                    />
                    <Row
                      label={t.pricing.rowBurst}
                      value={`${formatNumber(plan.burstPerMinute)} ${t.pricing.perMinute}`}
                    />
                  </dl>

                  <Button
                    asChild
                    variant={plan.highlight ? "default" : "outline"}
                    className="w-full"
                    disabled={isCurrent}
                  >
                    <Link href={user ? "/dashboard" : "/register"}>
                      {isCurrent
                        ? t.pricing.currentPlan
                        : plan.pricePerMonth === 0
                          ? t.pricing.startFree
                          : `${t.pricing.choose} ${copy.label}`}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Peningkatan paket masih manual selama pembayaran belum tersambung. */}
        <Card className="mt-6">
          <CardContent className="flex flex-wrap items-center gap-4 p-6">
            <Server className="size-5 shrink-0 text-primary" />
            <p className="min-w-0 flex-1 text-sm text-muted-foreground">
              {t.pricing.manualNote}
            </p>
          </CardContent>
        </Card>

        {/* Donasi */}
        <Card className="mt-16">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Heart className="size-6" />
            </span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t.pricing.donateTitle}
              </h2>
              <p className="mx-auto max-w-lg text-pretty text-muted-foreground">
                {t.pricing.donateBody}
              </p>
            </div>
            <Button variant="outline" asChild>
              <a
                href="https://saweria.co/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Heart />
                {t.pricing.donateCta}
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            {t.pricing.faqTitle}
          </h2>
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
            {t.pricing.faq.map((item) => (
              <Card key={item.q}>
                <CardContent className="p-5">
                  <h3 className="font-medium">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
