import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Tema dipasang sebelum halaman digambar. Kalau menunggu React,
          pengguna bertema terang akan melihat kilatan gelap lebih dulu
          (flash of wrong theme) pada setiap pemuatan halaman.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('freeall-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
