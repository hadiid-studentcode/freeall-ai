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
    "API Gateway open-source dengan sistem fallback cerdas. Daftarkan API key gratisan Anda dari Groq, Gemini, DeepSeek, dan lainnya.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      // Aplikasi memakai tema gelap permanen; kelas `dark` mengaktifkan
      // blok variabel warna di globals.css.
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
