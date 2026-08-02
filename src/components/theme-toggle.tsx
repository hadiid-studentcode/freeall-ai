"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUiCopy } from "@/lib/i18n/client";
import { setThemeAction } from "@/lib/theme/actions";
import { useTheme } from "@/lib/theme/client";
import type { Theme } from "@/lib/theme/shared";

/**
 * Pengalih tema: ikut sistem → terang → gelap → ikut sistem.
 *
 * Pilihan disimpan di cookie lalu halaman dimuat ulang dari server, sama
 * seperti pengalih bahasa. Karena kelas temanya sudah ikut di HTML pertama,
 * tidak ada lagi kebutuhan akan skrip inline yang berjalan sebelum React —
 * pendekatan lama yang memicu peringatan React soal tag skrip di dalam
 * komponen, sekaligus tidak benar-benar mencegah kilatan tema di App Router.
 */
const NEXT_THEME: Record<Theme, Theme> = {
  system: "light",
  light: "dark",
  dark: "system",
};

export function ThemeToggle() {
  const ui = useUiCopy();
  const theme = useTheme();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function cycle() {
    if (pending) return;
    startTransition(async () => {
      await setThemeAction(NEXT_THEME[theme]);
      router.refresh();
    });
  }

  const label =
    theme === "system"
      ? ui.themeSystem
      : theme === "light"
        ? ui.themeLight
        : ui.themeDark;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={cycle}
      title={label}
      aria-label={label}
      className={pending ? "opacity-60" : undefined}
    >
      {theme === "system" ? <Monitor /> : theme === "light" ? <Sun /> : <Moon />}
    </Button>
  );
}
