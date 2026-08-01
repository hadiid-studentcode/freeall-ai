import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/shared";

import { en } from "@/lib/i18n/en";
import { id } from "@/lib/i18n/id";

/**
 * Dwibahasa sederhana berbasis cookie.
 *
 * Tidak memakai awalan URL (`/en/...`) karena seluruh halaman di sini adalah
 * Server Component yang dirender per request — membaca cookie sudah cukup,
 * sekaligus menghindari penggandaan seluruh pohon rute.
 */

export {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  LOCALES,
  type Locale,
} from "@/lib/i18n/shared";

export const LOCALE_LABELS: Record<Locale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

const DICTIONARIES = { id, en } as const;

/** Bentuk kamus; `id` menjadi acuan sehingga `en` wajib melengkapinya. */
export type Dictionary = typeof id;

/** Bahasa yang dipilih pengunjung, dibaca dari cookie. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Pintasan yang lazim dipakai di Server Component. */
export async function getTranslations(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
