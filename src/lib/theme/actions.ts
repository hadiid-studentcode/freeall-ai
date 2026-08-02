"use server";

import { cookies } from "next/headers";

import { isTheme, THEME_COOKIE, type Theme } from "@/lib/theme/shared";

/** Simpan pilihan tema selama setahun. */
export async function setThemeAction(theme: Theme): Promise<void> {
  if (!isTheme(theme)) return;

  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
