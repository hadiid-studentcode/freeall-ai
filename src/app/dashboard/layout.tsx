import Link from "next/link";
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-10">
          <div>
            <Link href="/" className="text-lg font-semibold text-white hover:text-slate-100">
              Freeall AI
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/dashboard" className="rounded-full px-4 py-2 font-medium text-white hover:bg-slate-800/80">
              Dashboard
            </Link>
            <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-slate-800/80">
              Home
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
