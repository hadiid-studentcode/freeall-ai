import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

import {
  FallbackDiagram,
  KeyScopeDiagram,
  RequestFlowDiagram,
} from "@/components/docs/diagrams";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProviderCatalog } from "@/lib/ai/catalog";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t.home.metaDocsTitle, description: t.home.metaDocsDesc };
}



const SECTION_IDS = [
  { id: "alur", key: "flow" },
  { id: "fallback", key: "fallback" },
  { id: "kepemilikan", key: "ownership" },
  { id: "kuota", key: "quota" },
  { id: "api", key: "api" },
] as const;

export default async function DocsPage() {
  const { locale, t } = await getTranslations();

  const user = await getCurrentUser();
  const catalog = await getProviderCatalog();
  const providers = catalog.filter((preset) => preset.id !== "custom");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t.common.back}
          </Link>
          <div className="flex items-center gap-2">
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

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="max-w-2xl">
          <Badge variant="outline">{t.docs.eyebrow}</Badge>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.docs.title}
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            {t.docs.intro}
          </p>
        </div>

        {/* Daftar isi */}
        <nav className="mt-8 flex flex-wrap gap-2">
          {SECTION_IDS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {t.docs.sections[section.key]}
            </a>
          ))}
        </nav>

        <div className="mt-14 space-y-16">
          {/* 1. Alur request */}
          <section id="alur" className="scroll-mt-20 space-y-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                {t.docs.stepLabel} 1
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.docs.flowTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t.docs.flowSubtitle}
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <RequestFlowDiagram t={t.docs.diagrams} />
              </CardContent>
            </Card>

            <ol className="grid gap-4 sm:grid-cols-2">
              {t.docs.flowSteps.map((step, index) => (
                <li key={step.t}>
                  <Card className="h-full">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <h3 className="font-semibold">{step.t}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.d}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          {/* 2. Fallback */}
          <section id="fallback" className="scroll-mt-20 space-y-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                {t.docs.stepLabel} 2
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.docs.fallbackTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t.docs.fallbackSubtitlePre}{" "}
                <strong>{t.docs.fallbackSubtitleBold}</strong>
                {t.docs.fallbackSubtitlePost}
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <FallbackDiagram t={t.docs.diagrams} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t.docs.failureTableTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.docs.colProviderReply}</TableHead>
                      <TableHead>{t.docs.colMeaning}</TableHead>
                      <TableHead>{t.docs.colAction}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {t.docs.failures.map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="font-mono text-xs">
                          {row.code}
                        </TableCell>
                        <TableCell className="text-sm">{row.meaning}</TableCell>
                        <TableCell className="text-sm">{row.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.docs.selfHealTitle}</CardTitle>
                <CardDescription>
                  {t.docs.selfHealBody}
                </CardDescription>
              </CardHeader>
            </Card>
          </section>

          {/* 3. Kepemilikan kunci */}
          <section id="kepemilikan" className="scroll-mt-20 space-y-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                {t.docs.stepLabel} 3
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.docs.ownershipTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t.docs.ownershipSubtitle}
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <KeyScopeDiagram t={t.docs.diagrams} />
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t.docs.privateKeyTitle}</CardTitle>
                  <CardDescription>
                    {t.docs.privateKeyBody}
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t.docs.publicKeyTitle}</CardTitle>
                  <CardDescription>
                    {t.docs.publicKeyBody}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* 4. Kuota */}
          <section id="kuota" className="scroll-mt-20 space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.docs.quotaTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t.docs.quotaSubtitle}
              </p>
            </div>

            <Card>
              <CardContent className="px-0 sm:px-6 sm:pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.docs.colLimit}</TableHead>
                      <TableHead>{t.docs.colWhoSets}</TableHead>
                      <TableHead>{t.docs.colAppliesTo}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {t.docs.quotaRows.map((row) => (
                      <TableRow key={row.limit}>
                        <TableCell className="text-sm font-medium">
                          {row.limit}
                        </TableCell>
                        <TableCell className="text-sm">{row.who}</TableCell>
                        <TableCell className="text-sm">{row.applies}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* 5. Referensi API */}
          <section id="api" className="scroll-mt-20 space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.docs.apiTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t.docs.apiSubtitlePre}{" "}
                <Link
                  href="/dashboard/playground"
                  className="text-primary hover:underline"
                >
                  {t.footer.playground}
                </Link>
                {t.docs.apiSubtitlePost}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <CodeCard
                title={t.home.request}
                code={`curl -X POST https://api.freeall.ai/v1/chat \\
  -H "Authorization: Bearer sk-freeall-xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Halo!"}'`}
              />
              <CodeCard
                title={t.home.response}
                code={`{
  "success": true,
  "response": "Halo juga!",
  "provider": "groq",
  "model": "llama-3.1-8b-instant",
  "attempts": 3,
  "latencyMs": 812,
  "fallbacks": [
    { "provider": "gemini", "status": 429,
      "error": "Quota exceeded" }
  ]
}`}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.docs.bodyFormsTitle}</CardTitle>
                <CardDescription>
                  {t.docs.bodyFormsPre}{" "}
                  <code className="font-mono text-xs">prompt</code>
                  {t.docs.bodyFormsMid}{" "}
                  <code className="font-mono text-xs">messages</code>
                  {t.docs.bodyFormsOpts}{" "}
                  <code className="font-mono text-xs">temperature</code>,{" "}
                  <code className="font-mono text-xs">max_tokens</code>,{" "}
                  <code className="font-mono text-xs">provider</code>{" "}
                  {t.docs.bodyFormsPost}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.docs.statusTitle}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">{t.docs.colCode}</TableHead>
                      <TableHead>{t.docs.colMeaningShort}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {t.docs.statusCodes.map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="font-mono text-xs">
                          {row.code}
                        </TableCell>
                        <TableCell className="text-sm">{row.meaning}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t.docs.providersTitle(providers.length)}
                </CardTitle>
                <CardDescription>
                  {t.docs.providersBody}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {providers.map((preset) => (
                    <span
                      key={preset.id}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm"
                    >
                      {preset.label}
                      {preset.free && (
                        <span className="text-xs font-medium text-primary">
                          gratis
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <Card className="mt-16">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
            <h2 className="text-balance text-2xl font-semibold tracking-tight">
              {t.docs.ctaTitle}
            </h2>
            <p className="max-w-md text-muted-foreground">
              {t.docs.ctaBody}
            </p>
            <Button asChild size="lg">
              <Link href={user ? "/dashboard" : "/register"}>
                {user ? t.home.ctaPrimaryLoggedIn : t.home.ctaPrimary}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

function CodeCard({ title, code }: { title: string; code: string }) {
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
