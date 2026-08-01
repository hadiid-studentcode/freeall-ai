import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FreeAll AI — Routing AI tanpa batas",
    template: "%s",
  },
  description:
    "API Gateway dengan sistem fallback cerdas. Satukan API key gratisan Anda dari Groq, Gemini, Claude, dan puluhan penyedia lain dalam satu endpoint.",
};

/**
 * Memasang tema sebelum halaman digambar.
 *
 * Kalau menunggu React, pengguna bertema terang akan melihat kilatan gelap
 * lebih dulu di setiap pemuatan halaman. Dipasang lewat `next/script` dengan
 * strategi `beforeInteractive` — bukan tag `<script>` biasa — karena React
 * tidak menjalankan tag skrip yang dirender sebagai elemen komponen.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('freeall-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){document.documentElement.classList.add('dark')}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      // Kelas `dark` dipasang skrip di atas sebelum React berjalan, sehingga
      // markup server dan klien memang berbeda di sini — dan itu disengaja.
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
