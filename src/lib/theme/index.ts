import { cookies } from "next/headers";

import {
  DEFAULT_THEME,
  isTheme,
  THEME_COOKIE,
  type Theme,
} from "@/lib/theme/shared";

/**
 * Tema disimpan di cookie, bukan localStorage.
 *
 * Dengan begitu server sudah tahu temanya saat merender HTML pertama, sehingga
 * kelasnya bisa langsung ikut di `<html>`. Pendekatan localStorage menuntut
 * skrip inline yang berjalan sebelum React — dan di App Router, `next/script`
 * dengan `beforeInteractive` justru mengantrekan skrip itu untuk dijalankan
 * setelah runtime Next dimuat, jadi kilatan temanya tetap terjadi sekaligus
 * memicu peringatan React soal tag skrip di dalam komponen.
 */

export {
  DEFAULT_THEME,
  isTheme,
  THEME_COOKIE,
  THEMES,
  themeClass,
  type Theme,
} from "@/lib/theme/shared";

export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : DEFAULT_THEME;
}
