import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

import {
  FallbackDiagram,
  KeyScopeDiagram,
  RequestFlowDiagram,
} from "@/components/docs/diagrams";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProviderCatalog } from "@/lib/ai/catalog";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Dokumentasi · FreeAll AI",
  description:
    "Cara kerja FreeAll AI: alur request, fallback berlapis, kepemilikan kunci, dan referensi API.",
};

const SECTIONS = [
  { id: "alur", label: "Alur request" },
  { id: "fallback", label: "Fallback berlapis" },
  { id: "kepemilikan", label: "Kepemilikan kunci" },
  { id: "kuota", label: "Kuota & batas" },
  { id: "api", label: "Referensi API" },
];

const STATUS_CODES = [
  { code: "200", meaning: "Berhasil. Cek `attempts` untuk tahu berapa percobaan yang dilalui." },
  { code: "400", meaning: "Body tidak valid — `prompt` atau `messages` tidak ada, atau formatnya salah." },
  { code: "401", meaning: "API key hilang, salah, atau sudah dinonaktifkan." },
  { code: "429", meaning: "Kuota harian atau batas lonjakan terlampaui. Lihat header `Retry-After`." },
  { code: "503", meaning: "Tidak ada kunci provider yang bisa dipakai, atau semuanya gagal." },
];

export default async function DocsPage() {
  const user = await getCurrentUser();
  const catalog = await getProviderCatalog();
  const providers = catalog.filter((preset) => preset.id !== "custom");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href={user ? "/dashboard" : "/register"}>
              {user ? "Dashboard" : "Daftar gratis"}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="max-w-2xl">
          <Badge variant="outline">Dokumentasi</Badge>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Cara kerja FreeAll AI
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            FreeAll AI berdiri di antara aplikasi Anda dan puluhan penyedia AI.
            Aplikasi memanggil satu endpoint; gateway yang mengurus kunci mana
            yang dipakai, model mana yang masih punya kuota, dan apa yang
            dilakukan saat sebuah kunci kehabisan jatah.
          </p>
        </div>

        {/* Daftar isi */}
        <nav className="mt-8 flex flex-wrap gap-2">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="mt-14 space-y-16">
          {/* 1. Alur request */}
          <section id="alur" className="scroll-mt-20 space-y-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                Langkah 1
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Alur satu request
              </h2>
              <p className="mt-3 text-muted-foreground">
                Setiap panggilan melewati empat tahap sebelum menyentuh
                penyedia AI. Kalau salah satu tahap menolak, request berhenti di
                situ dan aplikasi Anda menerima alasannya.
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <RequestFlowDiagram />
              </CardContent>
            </Card>

            <ol className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  n: "1",
                  t: "Autentikasi",
                  d: "Header Authorization dicocokkan dengan API key Anda. Yang disimpan di database hanya hash-nya, jadi kunci asli tidak bisa dibaca ulang siapa pun.",
                },
                {
                  n: "2",
                  t: "Rate limit",
                  d: "Kuota harian per API key dan batas lonjakan per menit diperiksa. Kalau habis, balasannya 429 beserta perkiraan waktu pulih.",
                },
                {
                  n: "3",
                  t: "AiManager",
                  d: "Inti sistem. Menyusun daftar kunci yang boleh dipakai, lalu mencobanya satu per satu bersama model cadangannya.",
                },
                {
                  n: "4",
                  t: "Pencatatan",
                  d: "Hasilnya — berhasil atau gagal, berapa percobaan, berapa milidetik — ditulis ke RequestLog untuk riwayat dan perhitungan kuota.",
                },
              ].map((step) => (
                <li key={step.n}>
                  <Card className="h-full">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
                          {step.n}
                        </span>
                        <h3 className="font-semibold">{step.t}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.d}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          {/* 2. Fallback */}
          <section id="fallback" className="scroll-mt-20 space-y-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                Langkah 2
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Fallback berlapis
              </h2>
              <p className="mt-3 text-muted-foreground">
                Ini bagian yang membedakan FreeAll AI dari sekadar coba-ulang.
                Penyedia gratis menghitung kuota <strong>per model</strong>,
                bukan per akun — jadi model yang kehabisan jatah belum tentu
                berarti kuncinya habis.
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <FallbackDiagram />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Apa yang terjadi pada tiap jenis kegagalan
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Balasan penyedia</TableHead>
                      <TableHead>Artinya</TableHead>
                      <TableHead>Tindakan gateway</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">429</TableCell>
                      <TableCell className="text-sm">Kuota model habis</TableCell>
                      <TableCell className="text-sm">
                        Coba model berikutnya pada kunci yang sama
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">404</TableCell>
                      <TableCell className="text-sm">
                        Model sudah dipensiunkan
                      </TableCell>
                      <TableCell className="text-sm">
                        Coba model berikutnya pada kunci yang sama
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">401 / 403</TableCell>
                      <TableCell className="text-sm">
                        Kunci ditolak permanen
                      </TableCell>
                      <TableCell className="text-sm">
                        Kunci dinonaktifkan otomatis, lanjut ke kunci berikutnya
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">5xx</TableCell>
                      <TableCell className="text-sm">
                        Gangguan sementara
                      </TableCell>
                      <TableCell className="text-sm">
                        Dicatat, lanjut ke percobaan berikutnya
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Menyembuhkan diri</CardTitle>
                <CardDescription>
                  Kalau model cadangan yang akhirnya berhasil, model itu
                  dinaikkan menjadi model utama. Request berikutnya langsung
                  memakai yang terbukti jalan, tidak lagi membuang satu
                  percobaan ke model yang sedang habis.
                </CardDescription>
              </CardHeader>
            </Card>
          </section>

          {/* 3. Kepemilikan kunci */}
          <section id="kepemilikan" className="scroll-mt-20 space-y-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                Langkah 3
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Kunci siapa dipakai siapa
              </h2>
              <p className="mt-3 text-muted-foreground">
                Kunci yang Anda daftarkan bersifat pribadi. Pengguna lain dan
                pengunjung demo tidak pernah menyentuhnya — kuota yang Anda
                bayar atau Anda kumpulkan tetap milik Anda.
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <KeyScopeDiagram />
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Kunci pribadi</CardTitle>
                  <CardDescription>
                    Bawaan setiap kunci yang Anda tambahkan. Hanya dipakai akun
                    Anda, dan selalu dicoba lebih dulu sebelum yang lain.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Provider Publik</CardTitle>
                  <CardDescription>
                    Kunci yang sengaja dibagikan admin. Menjadi cadangan bagi
                    semua pengguna sekaligus tenaga untuk demo di halaman depan
                    yang bisa dicoba tanpa mendaftar.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* 4. Kuota */}
          <section id="kuota" className="scroll-mt-20 space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Kuota dan batas
              </h2>
              <p className="mt-3 text-muted-foreground">
                Ada tiga lapis pembatas dengan tujuan berbeda. Semuanya berjalan
                sebelum request menyentuh penyedia AI.
              </p>
            </div>

            <Card>
              <CardContent className="px-0 sm:px-6 sm:pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batas</TableHead>
                      <TableHead>Siapa yang mengatur</TableHead>
                      <TableHead>Berlaku untuk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm font-medium">
                        Kuota harian API key
                      </TableCell>
                      <TableCell className="text-sm">Anda sendiri</TableCell>
                      <TableCell className="text-sm">
                        Tiap API key, agar satu aplikasi tidak menghabiskan
                        semuanya
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm font-medium">
                        Kuota Provider Publik
                      </TableCell>
                      <TableCell className="text-sm">Admin</TableCell>
                      <TableCell className="text-sm">
                        Pengguna yang belum membawa kunci sendiri. Lepas begitu
                        Anda menambahkan kunci pribadi
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm font-medium">
                        Batas lonjakan
                      </TableCell>
                      <TableCell className="text-sm">Sistem</TableCell>
                      <TableCell className="text-sm">
                        30 request per menit per API key
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* 5. Referensi API */}
          <section id="api" className="scroll-mt-20 space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Referensi API
              </h2>
              <p className="mt-3 text-muted-foreground">
                Satu endpoint untuk semua penyedia. Uji langsung tanpa menulis
                kode lewat{" "}
                <Link
                  href="/dashboard/playground"
                  className="text-primary hover:underline"
                >
                  Playground
                </Link>
                .
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <CodeCard
                title="Request"
                code={`curl -X POST https://api.freeall.ai/v1/chat \\
  -H "Authorization: Bearer sk-freeall-xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Halo!"}'`}
              />
              <CodeCard
                title="Response"
                code={`{
  "success": true,
  "response": "Halo juga!",
  "provider": "groq",
  "model": "llama-3.1-8b-instant",
  "attempts": 3,
  "latencyMs": 812,
  "fallbacks": [
    { "provider": "gemini", "status": 429,
      "error": "Quota exceeded" }
  ]
}`}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bentuk body lain</CardTitle>
                <CardDescription>
                  Selain <code className="font-mono text-xs">prompt</code>,
                  endpoint menerima percakapan multi-giliran lewat{" "}
                  <code className="font-mono text-xs">messages</code>, serta
                  opsi <code className="font-mono text-xs">temperature</code>,{" "}
                  <code className="font-mono text-xs">max_tokens</code>, dan{" "}
                  <code className="font-mono text-xs">provider</code> untuk
                  memaksa satu penyedia.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kode status</CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Kode</TableHead>
                      <TableHead>Arti</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {STATUS_CODES.map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="font-mono text-xs">
                          {row.code}
                        </TableCell>
                        <TableCell className="text-sm">{row.meaning}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {providers.length} penyedia dikenali otomatis
                </CardTitle>
                <CardDescription>
                  Tempel API key apa adanya — penyedianya dikenali dari bentuk
                  kunci, dan model yang masih aktif ditanyakan langsung ke
                  sumbernya.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {providers.map((preset) => (
                    <span
                      key={preset.id}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm"
                    >
                      {preset.label}
                      {preset.free && (
                        <span className="text-xs font-medium text-primary">
                          gratis
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <Card className="mt-16">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
            <h2 className="text-balance text-2xl font-semibold tracking-tight">
              Siap mencoba?
            </h2>
            <p className="max-w-md text-muted-foreground">
              Daftar, tempel satu API key gratisan, lalu panggil endpoint yang
              sama dari aplikasi Anda.
            </p>
            <Button asChild size="lg">
              <Link href={user ? "/dashboard" : "/register"}>
                {user ? "Buka dashboard" : "Mulai gratis"}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

function CodeCard({ title, code }: { title: string; code: string }) {
  return (
    <Card>
      <CardContent className="p-0">
        <p className="border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed scrollbar-thin">
          <code className="font-mono">{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
