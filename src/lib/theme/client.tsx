"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_THEME, type Theme } from "@/lib/theme/shared";

/**
 * Tema yang sedang berlaku, untuk Client Component.
 *
 * Disediakan lewat context alih-alih props supaya tombol tema bisa dipasang di
 * mana saja tanpa setiap halaman ikut meneruskan nilainya — sama seperti
 * `LocaleProvider`.
 */
const ThemeContext = createContext<Theme>(DEFAULT_THEME);

export function ThemeProvider({
  value,
  children,
}: {
  value: Theme;
  children: ReactNode;
}) {
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
