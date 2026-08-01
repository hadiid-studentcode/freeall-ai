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

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/dashboard/providers", label: "Provider AI", icon: Server },
  { href: "/dashboard/api-keys", label: "API Key", icon: KeyRound },
  { href: "/dashboard/playground", label: "Playground", icon: TerminalSquare },
  { href: "/dashboard/logs", label: "Riwayat", icon: ScrollText },
  { href: "/dashboard/plan", label: "Paket", icon: Sparkles },
];

const ADMIN_LINK = {
  href: "/dashboard/admin",
  label: "Admin",
  icon: ShieldCheck,
};

export function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
