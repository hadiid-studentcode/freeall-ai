"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Server,
  Sparkles,
  TerminalSquare,
  ShieldCheck,
} from "lucide-react";

import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", key: "overview", icon: LayoutDashboard },
  { href: "/dashboard/providers", key: "providers", icon: Server },
  { href: "/dashboard/api-keys", key: "apiKeys", icon: KeyRound },
  { href: "/dashboard/playground", key: "playground", icon: TerminalSquare },
  { href: "/dashboard/logs", key: "logs", icon: ScrollText },
  { href: "/dashboard/plan", key: "plan", icon: Sparkles },
] as const;

const ADMIN_LINK = {
  href: "/dashboard/admin",
  key: "admin",
  icon: ShieldCheck,
} as const;

export function DashboardNav({
  isAdmin,
  t,
}: {
  isAdmin: boolean;
  t: Dictionary["dash"]["nav"];
}) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, ADMIN_LINK] : LINKS;

  return (
    <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 scrollbar-thin sm:px-6 lg:px-8">
      {links.map((link) => {
        // "/dashboard" hanya aktif pada kecocokan persis, supaya tidak ikut
        // menyala saat berada di sub-halamannya.
        const active =
          link.href === "/dashboard"
            ? pathname === link.href
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <link.icon className="size-4" />
            {t[link.key]}
          </Link>
        );
      })}
    </nav>
  );
}
