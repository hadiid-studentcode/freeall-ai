import Link from "next/link";
import type { ReactNode } from "react";
import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Zap className="size-5" />
        </span>
        <span className="text-lg font-semibold">FreeAll AI</span>
      </Link>

      <div className="w-full max-w-sm">{children}</div>

      <p className="mt-8 max-w-sm text-center text-xs text-muted-foreground">
        Routing AI tanpa batas — API Gateway dengan sistem fallback cerdas.
      </p>
    </div>
  );
}
