import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t.home.metaTermsTitle, description: t.home.metaTermsDesc };
}

export default async function TermsPage() {
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
        <Badge variant="outline">{t.terms.eyebrow}</Badge>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight">
          {t.terms.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {t.terms.intro}
        </p>

        <Alert variant="warning" className="mt-8">
          <TriangleAlert />
          <AlertDescription>{t.terms.notice}</AlertDescription>
        </Alert>

        <div className="mt-12 space-y-10">
          {t.terms.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
