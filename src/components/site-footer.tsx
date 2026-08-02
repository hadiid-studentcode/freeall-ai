import Link from "next/link";

import { getTranslations } from "@/lib/i18n";
import { ShieldCheck, Zap } from "lucide-react";

export async function SiteFooter() {
  const { t } = await getTranslations();

  const columns = [
    {
      title: t.footer.product,
      links: [
        { href: "/#cara-kerja", label: t.common.howItWorks },
        { href: "/pricing", label: t.common.pricing },
        { href: "/docs", label: t.common.docs },
        { href: "/dashboard/playground", label: t.footer.playground },
      ],
    },
    {
      title: t.footer.account,
      links: [
        { href: "/register", label: t.common.register },
        { href: "/login", label: t.common.login },
        { href: "/dashboard", label: t.common.dashboard },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { href: "/terms", label: t.footer.terms },
        { href: "/privacy", label: t.footer.privacy },
        { href: "/privacy#keamanan", label: t.footer.security_link },
      ],
    },
  ];

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Zap className="size-4" />
              </span>
              <span className="font-semibold">FreeAll AI</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              {t.footer.tagline}
            </p>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                {t.footer.security}
              </span>
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} FreeAll AI. {t.footer.onPremise}
          </p>
          <p className="max-w-xl sm:text-right">
            {t.footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
}
