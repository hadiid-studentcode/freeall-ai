"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import { setLocaleAction } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/shared";
import { cn } from "@/lib/utils";

/**
 * Pengalih bahasa.
 *
 * Bahasa disimpan di cookie lalu halaman dimuat ulang dari server, karena
 * seluruh teks dirender di Server Component — tidak ada kamus yang dikirim
 * ke peramban, jadi bundel klien tidak ikut membengkak.
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(locale: Locale) {
    if (locale === current || pending) return;
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
    });
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-border p-0.5"
      role="group"
      aria-label="Bahasa"
    >
      <Languages
        className="ml-1.5 size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => pick(locale)}
          aria-pressed={locale === current}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium uppercase transition-colors",
            locale === current
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground",
            pending && "opacity-60",
          )}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
