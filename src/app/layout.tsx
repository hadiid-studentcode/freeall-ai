import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { getLocale, getTranslations } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/client";
import { getTheme } from "@/lib/theme";
import { ThemeProvider } from "@/lib/theme/client";
import { themeClass } from "@/lib/theme/shared";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Judul dan deskripsi ikut bahasa pilihan pengunjung, jadi dipakai
// generateMetadata (async) alih-alih objek metadata statis.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: { default: t.home.metaTitle, template: "%s" },
    description: t.home.metaDescription,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Bahasa dan tema sama-sama dibaca dari cookie di server.
  //
  // Tema karena itu sudah benar sejak byte pertama HTML: tidak ada skrip yang
  // perlu berjalan lebih dulu, dan tidak ada beda markup server/klien yang
  // perlu dibungkam dengan suppressHydrationWarning. Atribut `lang` juga
  // penting untuk pembaca layar dan mesin telusur.
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full ${themeClass(theme)}`}
    >
      <body className="min-h-full">
        <LocaleProvider value={locale}>
          <ThemeProvider value={theme}>{children}</ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
