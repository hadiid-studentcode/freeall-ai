import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut, Zap } from "lucide-react";

import { DashboardNav } from "@/app/dashboard/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/guard";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Layout hanya penjaga lapis pertama; tiap page dan Server Action tetap
  // memanggil requireUser() sendiri karena bisa diakses tanpa lewat sini.
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Zap className="size-4" />
            </span>
            <span className="font-semibold">FreeAll AI</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.name ?? user.email}
            </span>
            {user.role === "ADMIN" && <Badge variant="default">Admin</Badge>}
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </form>
          </div>
        </div>

        <DashboardNav isAdmin={user.role === "ADMIN"} />
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
