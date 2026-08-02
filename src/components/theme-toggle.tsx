"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUiCopy } from "@/lib/i18n/client";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "freeall-theme";
const CHANGE_EVENT = "freeall-theme-change";

/**
 * Tema dibaca lewat `useSyncExternalStore`, bukan state + efek.
 *
 * Sumber kebenarannya ada di luar React (localStorage dan preferensi sistem),
 * dan hook ini memang dibuat untuk itu: React membaca ulang saat sumbernya
 * berubah, tanpa perlu menyalin nilainya ke state di dalam efek.
 */
function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  // `storage` menangani perubahan dari tab lain; event khusus menangani
  // perubahan di tab ini sendiri, karena `storage` tidak menyala di tab
  // yang melakukan penulisan.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  media.addEventListener("change", onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
    media.removeEventListener("change", onChange);
  };
}

function getSnapshot(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
}

/** Di server tema belum diketahui; skrip di <head> yang menerapkannya. */
function getServerSnapshot(): Theme | null {
  return null;
}

function apply(theme: Theme): void {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const ui = useUiCopy();
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function cycle() {
    const next: Theme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  const label =
    theme === null
      ? ui.themeToggle
      : theme === "system"
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
    >
      {/* Sebelum hydration tema belum diketahui, jadi ikonnya disamarkan
          agar tidak sempat menampilkan pilihan yang salah. */}
      {theme === null ? (
        <Monitor className="opacity-0" />
      ) : theme === "system" ? (
        <Monitor />
      ) : theme === "light" ? (
        <Sun />
      ) : (
        <Moon />
      )}
    </Button>
  );
}
