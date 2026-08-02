import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck, TriangleAlert } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t.home.metaPrivacyTitle, description: t.home.metaPrivacyDesc };
}

export default async function PrivacyPage() {
  const { locale, t } = await getTranslations();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Badge variant="outline">{t.privacy.eyebrow}</Badge>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight">
          {t.privacy.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {t.privacy.intro}
        </p>

        <Alert variant="warning" className="mt-8">
          <TriangleAlert />
          <AlertDescription>
            <strong>{t.privacy.warningBold}</strong> {t.privacy.warningBody}
          </AlertDescription>
        </Alert>

        <div className="mt-12 space-y-12">
          <Section id="keamanan" title={t.privacy.storageTitle}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="p-5">
                  <ShieldCheck className="size-5 text-primary" />
                  <h3 className="mt-3 font-semibold">
                    {t.privacy.encryptedTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t.privacy.encryptedBody}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <KeyRound className="size-5 text-primary" />
                  <h3 className="mt-3 font-semibold">
                    {t.privacy.unreadableTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t.privacy.unreadableBody}
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {t.privacy.previewNote}{" "}
              <code className="font-mono text-xs">gsk_yD…f1YV</code>{" "}
              {t.privacy.previewNotePost}
            </p>
          </Section>

          <Section title={t.privacy.storedTitle}>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {t.privacy.stored.map((item) => (
                <li key={item.label}>
                  <strong className="text-foreground">{item.label}.</strong>{" "}
                  {item.body}
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t.privacy.notDoTitle}>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {t.privacy.notDo.map((item) => (
                <li key={item.slice(0, 40)}>• {item}</li>
              ))}
            </ul>
          </Section>

          <Section title={t.privacy.thirdPartyTitle}>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.privacy.thirdPartyBody}
            </p>
          </Section>

          <Section title={t.privacy.deleteTitle}>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.privacy.deleteBody}
            </p>
          </Section>

          <Section title={t.privacy.onPremiseTitle}>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.privacy.onPremiseBody}
            </p>
          </Section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
