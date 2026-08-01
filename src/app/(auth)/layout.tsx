import Link from "next/link";
import type { ReactNode } from "react";
import { Zap } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getTranslations } from "@/lib/i18n";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { locale, t } = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Zap className="size-5" />
        </span>
        <span className="text-lg font-semibold">FreeAll AI</span>
      </Link>

      <div className="w-full max-w-sm">{children}</div>

      <div className="mt-6 flex items-center gap-2">
        <LanguageSwitcher current={locale} />
        <ThemeToggle />
      </div>

      <p className="mt-8 max-w-sm text-center text-xs text-muted-foreground">
        {t.auth.tagline}
      </p>
    </div>
  );
}
