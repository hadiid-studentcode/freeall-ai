"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/shared";

/**
 * Bahasa untuk Client Component.
 *
 * Kamus utama sengaja tidak pernah menyeberang ke peramban — seluruh teks
 * halaman dirender di server supaya bundel klien tetap ramping. Tetapi
 * segelintir kontrol (pengalih bahasa, tombol tema, tombol salin) dipakai di
 * mana-mana dan hanya butuh beberapa kata; mengoper propsnya satu per satu
 * dari tiap pemanggil hanya menambah kebisingan. Untuk itulah context ini ada,
 * berisi kamus mini yang boleh ikut ke klien.
 */

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  value,
  children,
}: {
  value: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext value={value}>{children}</LocaleContext>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

const UI = {
  id: {
    language: "Bahasa",
    themeToggle: "Ganti tema",
    themeSystem: "Mengikuti sistem",
    themeLight: "Mode terang",
    themeDark: "Mode gelap",
    copy: "Salin",
    copied: "Tersalin",
  },
  en: {
    language: "Language",
    themeToggle: "Change theme",
    themeSystem: "Following the system",
    themeLight: "Light mode",
    themeDark: "Dark mode",
    copy: "Copy",
    copied: "Copied",
  },
} satisfies Record<Locale, Record<string, string>>;

/** Kamus mini untuk kontrol yang dipakai lintas halaman. */
export function useUiCopy() {
  return UI[useLocale()];
}
