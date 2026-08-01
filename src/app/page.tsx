import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardPaste,
  Code,
  KeyRound,
  Repeat,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { DemoChat } from "@/components/chat/demo-chat";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProviderCatalog } from "@/lib/ai/catalog";
import { getCurrentUser } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

// Ikon tetap di kode; judul dan isinya diambil dari kamus bahasa.
const STEP_ICONS = [ClipboardPaste, Sparkles, Send];
const LAYER_ICONS = [Repeat, KeyRound, ShieldCheck];

const CURL_EXAMPLE = `curl -X POST https://api.freeall.ai/v1/chat \\
  -H "Authorization: Bearer sk-freeall-xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Halo!"}'`;

const RESPONSE_EXAMPLE = `{
  "success": true,
  "response": "Halo juga! Ada yang bisa saya bantu?",
  "provider": "gemini",
  "model": "gemini-flash-latest",
  "attempts": 2,
  "latencyMs": 812
}`;

export default async function Home() {
  const { locale, t } = await getTranslations();
  const user = await getCurrentUser();
  const catalog = await getProviderCatalog();
  const providers = catalog.filter((preset) => preset.id !== "custom");
  const freeProviders = providers.filter((preset) => preset.free);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Angka nyata dari instance ini, bukan hiasan. Kalau masih nol, bagian
  // statistik disembunyikan daripada memajang angka kosong.
  const [activeProviders, requestsToday, successToday] = await Promise.all([
    prisma.providerKey.count({ where: { isActive: true, scope: "SHARED" } }),
    prisma.requestLog.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.requestLog.count({
      where: { createdAt: { gte: startOfDay }, success: true },
    }),
  ]);

  const successRate =
    requestsToday === 0 ? null : Math.round((successToday / requestsToday) * 100);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Zap className="size-4" />
            </span>
            <span className="font-semibold">FreeAll AI</span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="#cara-kerja"
              className="hidden px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t.common.howItWorks}
            </a>
            <a
              href="#api"
              className="hidden px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t.common.api}
            </a>
            <Link
              href="/pricing"
              className="hidden px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t.common.pricing}
            </Link>
            <Link
              href="/docs"
              className="hidden px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t.common.docs}
            </Link>
            <LanguageSwitcher current={locale} />
            <ThemeToggle />
            {user ? (

              <Button asChild size="sm">
                <Link href="/dashboard">
                  {t.common.dashboard}
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{t.common.login}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">{t.common.register}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero + demo */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Cahaya latar; pointer-events-none agar tidak menghalangi klik. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.07] blur-3xl"
          />

          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
            <div className="space-y-7">
              <Badge variant="outline" className="gap-1.5">
                <Code className="size-3" />
                {t.home.badge}
              </Badge>

              <div className="space-y-5">
                <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                  {t.home.titleLead}{" "}
                  <span className="text-primary">{t.home.titleAccent}</span>
                </h1>

                <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                  {t.home.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/register"}>
                    {user ? t.home.ctaPrimaryLoggedIn : t.home.ctaPrimary}
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/docs">{t.home.ctaSecondary}</Link>
                </Button>
              </div>

              <ul className="grid gap-2 pt-1 sm:grid-cols-2">
                {t.home.perks.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:pl-4">
              {/*
                Demo ditenagai Provider Publik. Kalau admin menariknya semua,
                kotak chat disembunyikan — lebih jujur daripada membiarkan
                pengunjung mengetik lalu menerima error.
              */}
              {activeProviders > 0 ? (
                <DemoChat t={t.demo} />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Sparkles className="size-5" />
                    </span>
                    <div className="space-y-2">
                      <h2 className="font-semibold">
                        {t.home.demoUnavailableTitle}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {t.home.demoUnavailableBody}
                      </p>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/register">
                        {t.common.register}
                        <ArrowRight />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Statistik nyata — hanya tampil bila instance sudah dipakai */}
        {requestsToday > 0 && (
          <section className="border-b border-border bg-card/30">
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
              <Stat
                value={formatNumber(activeProviders)}
                label={t.home.statsKeys}
              />
              <Stat
                value={formatNumber(requestsToday)}
                label={t.home.statsRequests}
              />
              <Stat
                value={successRate === null ? "—" : `${successRate}%`}
                label={t.home.statsSuccess}
              />
            </div>
          </section>
        )}

        {/* Cara kerja */}
        <section
          id="cara-kerja"
          className="scroll-mt-20 border-b border-border"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                {t.home.stepsEyebrow}
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.home.stepsTitle}
              </h2>
            </div>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {t.home.steps.map((step, index) => {
                const Icon = STEP_ICONS[index];
                return (
                <li key={step.title}>
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {t.home.stepLabel} {index + 1}
                        </span>
                      </div>
                      <h3 className="mt-4 font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </CardContent>
                  </Card>
                </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Fallback berlapis */}
        <section className="border-b border-border bg-card/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                {t.home.fallbackEyebrow}
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.home.fallbackTitle}
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                {t.home.fallbackSubtitle}
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {t.home.fallbackLayers.map((layer, index) => {
                const Icon = LAYER_ICONS[index];
                return (
                <Card
                  key={layer.title}
                  className="transition-colors hover:border-primary/40"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <Badge variant="secondary">{layer.accent}</Badge>
                    </div>
                    <h3 className="mt-4 font-semibold">{layer.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {layer.body}
                    </p>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Penyedia didukung */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                {t.home.providersEyebrow}
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.home.providersTitle(providers.length)}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t.home.providersSubtitle(freeProviders.length)}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {providers.map((preset) => (
                <span
                  key={preset.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors hover:border-primary/40"
                >
                  {preset.label}
                  {preset.free && (
                    <span className="text-xs font-medium text-primary">
                      {t.common.free}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Contoh API */}
        <section id="api" className="scroll-mt-20 border-b border-border bg-card/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                {t.home.apiEyebrow}
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.home.apiTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t.home.apiSubtitle}
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              <CodeBlock title={t.home.request} code={CURL_EXAMPLE} />
              <CodeBlock title={t.home.response} code={RESPONSE_EXAMPLE} />
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              <code className="font-mono text-xs">attempts: 2</code>{" "}
              {t.home.apiNote}
            </p>
          </div>
        </section>

        {/* Ajakan terakhir */}
        <section>
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col items-center gap-6 p-10 text-center sm:p-14">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Zap className="size-6" />
                </span>
                <div className="space-y-3">
                  <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                    {t.home.finalTitle}
                  </h2>
                  <p className="mx-auto max-w-lg text-pretty text-muted-foreground">
                    {t.home.finalBody}
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/register"}>
                    {user ? t.home.ctaPrimaryLoggedIn : t.common.register}
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <SiteFooter />

    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-3xl font-semibold tabular-nums text-primary">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <Card>
      <CardContent className="p-0">
        <p className="border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed scrollbar-thin">
          <code className="font-mono">{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
