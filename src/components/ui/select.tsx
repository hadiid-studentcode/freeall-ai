import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Select native, bukan Radix.
 *
 * Semua form dashboard dikirim lewat Server Action tanpa JavaScript tambahan,
 * dan `<select>` native ikut terkirim apa adanya — sekaligus tetap berfungsi
 * sebelum halaman selesai hydrate.
 */
export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-10 w-full appearance-none rounded-lg border border-input bg-background/40 px-3 py-2 pr-9 text-sm",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
