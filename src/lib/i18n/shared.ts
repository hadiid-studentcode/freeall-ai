/**
 * Konstanta i18n yang aman dipakai di Client Component.
 *
 * Dipisah dari `index.ts` karena file itu mengimpor `next/headers`, yang
 * hanya boleh dipakai di server. Tanpa pemisahan ini, mengimpor tipe `Locale`
 * dari komponen klien akan menarik modul server dan menggagalkan build.
 */
export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "freeall_locale";
export const DEFAULT_LOCALE: Locale = "id";

export function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}
