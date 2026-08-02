/**
 * Konstanta tema yang aman dipakai di Client Component.
 *
 * Dipisah dari `index.ts` karena file itu mengimpor `next/headers`, yang hanya
 * boleh dipakai di server — pola yang sama dengan `@/lib/i18n/shared`.
 */
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = "freeall_theme";
export const DEFAULT_THEME: Theme = "system";

export function isTheme(value: string | undefined): value is Theme {
  return (THEMES as readonly string[]).includes(value ?? "");
}

/**
 * Kelas yang dipasang di `<html>`.
 *
 * `system` sengaja tidak menghasilkan kelas apa pun: tanpa kelas, `:root`
 * memakai `color-scheme: light dark`, dan `light-dark()` di globals.css
 * mengikuti preferensi sistem operasi tanpa perlu JavaScript sama sekali.
 */
export function themeClass(theme: Theme): string {
  return theme === "system" ? "" : theme;
}
