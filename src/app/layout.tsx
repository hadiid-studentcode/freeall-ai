import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { getLocale, getTranslations } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/client";

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

/**
 * Memasang tema sebelum halaman digambar.
 *
 * Kalau menunggu React, pengguna bertema terang akan melihat kilatan gelap
 * lebih dulu di setiap pemuatan halaman. Dipasang lewat `next/script` dengan
 * strategi `beforeInteractive` — bukan tag `<script>` biasa — karena React
 * tidak menjalankan tag skrip yang dirender sebagai elemen komponen.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('freeall-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){document.documentElement.classList.add('dark')}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Atribut lang penting untuk pembaca layar dan mesin telusur, jadi harus
  // ikut bahasa yang dipilih pengunjung.
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      // Kelas `dark` dipasang skrip di atas sebelum React berjalan, sehingga
      // markup server dan klien memang berbeda di sini — dan itu disengaja.
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <LocaleProvider value={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
