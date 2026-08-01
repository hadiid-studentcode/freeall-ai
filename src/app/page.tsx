import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardPaste,
  Code,
  KeyRound,
  Repeat,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { DemoChat } from "@/components/chat/demo-chat";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProviderCatalog } from "@/lib/ai/catalog";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

const STEPS = [
  {
    icon: ClipboardPaste,
    title: "Tempel API key",
    body: "Ambil kunci gratis dari Groq, Gemini, atau penyedia lain, lalu tempel apa adanya. Tidak perlu tahu Base URL maupun nama model.",
  },
  {
    icon: Sparkles,
    title: "Sistem yang menata",
    body: "Penyedia dikenali dari bentuk kuncinya, model yang masih hidup ditanyakan langsung ke sumbernya, lalu diuji sekali sebelum disimpan.",
  },
  {
    icon: Send,
    title: "Panggil satu endpoint",
    body: "Aplikasi Anda cukup memanggil /api/v1/chat. Urusan limit, model mati, dan pergantian penyedia ditangani gateway.",
  },
];

const FALLBACK_LAYERS = [
  {
    icon: Repeat,
    title: "Model kena limit",
    body: "Kuota gratis dihitung per model. Saat model utama membalas 429, gateway langsung mencoba model lain pada kunci yang sama.",
    accent: "Lapis 1",
  },
  {
    icon: KeyRound,
    title: "Kunci habis",
    body: "Kalau semua model di kunci itu ikut habis, giliran kunci berikutnya sesuai prioritas — bisa penyedia yang sama atau berbeda.",
    accent: "Lapis 2",
  },
  {
    icon: ShieldCheck,
    title: "Kunci ditolak",
    body: "Kunci yang dibalas 401 atau 403 dinonaktifkan otomatis beserta alasannya, jadi tidak memperlambat request berikutnya.",
    accent: "Lapis 3",
  },
];

const CURL_EXAMPLE = `curl -X POST https://api.freeall.ai/v1/chat \\
  -H "Authorization: Bearer sk-freeall-xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Halo!"}'`;

const RESPONSE_EXAMPLE = `{
  "success": true,
  "response": "Halo juga! Ada yang bisa saya bantu?",
  "provider": "gemini",
  "model": "gemini-flash-latest",
  "attempts": 2,
  "latencyMs": 812
}`;

export default async function Home() {
  const user = await getCurrentUser();
  const catalog = await getProviderCatalog();
  const providers = catalog.filter((preset) => preset.id !== "custom");
  const freeProviders = providers.filter((preset) => preset.free);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Angka nyata dari instance ini, bukan hiasan. Kalau masih nol, bagian
  // statistik disembunyikan daripada memajang angka kosong.
  const [activeProviders, requestsToday, successToday] = await Promise.all([
    prisma.providerKey.count({ where: { isActive: true, scope: "SHARED" } }),
    prisma.requestLog.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.requestLog.count({
      where: { createdAt: { gte: startOfDay }, success: true },
    }),
  ]);

  const successRate =
    requestsToday === 0 ? null : Math.round((successToday / requestsToday) * 100);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Zap className="size-4" />
            </span>
            <span className="font-semibold">FreeAll AI</span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="#cara-kerja"
              className="hidden px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Cara kerja
            </a>
            <a
              href="#api"
              className="hidden px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              API
            </a>
            <Link
              href="/docs"
              className="hidden px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Dokumentasi
            </Link>
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Masuk</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Daftar gratis</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero + demo */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Cahaya latar; pointer-events-none agar tidak menghalangi klik. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.07] blur-3xl"
          />

          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
            <div className="space-y-7">
              <Badge variant="outline" className="gap-1.5">
                <Code className="size-3" />
                Gratis untuk dipakai · Bisa di-self-host
              </Badge>

              <div className="space-y-5">
                <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                  Routing AI{" "}
                  <span className="text-primary">tanpa batas</span>
                </h1>

                <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                  Kumpulkan API key gratisan Anda dari berbagai penyedia AI di
                  satu tempat. Saat satu kunci kena limit, permintaan otomatis
                  diteruskan ke model dan kunci berikutnya — aplikasi Anda tidak
                  perlu tahu apa-apa.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/register"}>
                    {user ? "Buka dashboard" : "Mulai gratis"}
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/docs">Lihat cara kerjanya</Link>
                </Button>
              </div>

              <ul className="grid gap-2 pt-1 sm:grid-cols-2">
                {[
                  "Tanpa kartu kredit",
                  "Kunci dienkripsi AES-256",
                  "Fallback model dan kunci",
                  "Bisa di-self-host penuh",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:pl-4">
              {/*
                Demo ditenagai Provider Publik. Kalau admin menariknya semua,
                kotak chat disembunyikan — lebih jujur daripada membiarkan
                pengunjung mengetik lalu menerima error.
              */}
              {activeProviders > 0 ? (
                <DemoChat />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Sparkles className="size-5" />
                    </span>
                    <div className="space-y-2">
                      <h2 className="font-semibold">
                        Demo sedang tidak tersedia
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Admin belum menyediakan Provider Publik untuk dicoba
                        pengunjung. Daftar dan tambahkan API key gratisan Anda
                        sendiri untuk mulai memakai gateway.
                      </p>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/register">
                        Daftar gratis
                        <ArrowRight />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Statistik nyata — hanya tampil bila instance sudah dipakai */}
        {requestsToday > 0 && (
          <section className="border-b border-border bg-card/30">
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
              <Stat
                value={formatNumber(activeProviders)}
                label="Kunci aktif di Provider Publik"
              />
              <Stat
                value={formatNumber(requestsToday)}
                label="Request diproses hari ini"
              />
              <Stat
                value={successRate === null ? "—" : `${successRate}%`}
                label="Berhasil dijawab"
              />
            </div>
          </section>
        )}

        {/* Cara kerja */}
        <section
          id="cara-kerja"
          className="scroll-mt-20 border-b border-border"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                Cara kerja
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Tiga langkah, tanpa konfigurasi rumit
              </h2>
            </div>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <step.icon className="size-4" />
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          Langkah {index + 1}
                        </span>
                      </div>
                      <h3 className="mt-4 font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Fallback berlapis */}
        <section className="border-b border-border bg-card/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                Inti sistem
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Fallback berlapis, bukan sekadar coba ulang
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                Penyedia gratis menghitung kuota per model, bukan per akun.
                Karena itu gateway turun bertahap: model dulu, baru kunci.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {FALLBACK_LAYERS.map((layer) => (
                <Card
                  key={layer.title}
                  className="transition-colors hover:border-primary/40"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <layer.icon className="size-4" />
                      </span>
                      <Badge variant="secondary">{layer.accent}</Badge>
                    </div>
                    <h3 className="mt-4 font-semibold">{layer.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {layer.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Penyedia didukung */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                Penyedia
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {providers.length} penyedia siap pakai
              </h2>
              <p className="mt-3 text-muted-foreground">
                {freeProviders.length} di antaranya punya tier gratis. Penyedia
                lain yang kompatibel format OpenAI bisa ditambahkan sendiri.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {providers.map((preset) => (
                <span
                  key={preset.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors hover:border-primary/40"
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
          </div>
        </section>

        {/* Contoh API */}
        <section id="api" className="scroll-mt-20 border-b border-border bg-card/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                API
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Satu endpoint, semua penyedia
              </h2>
              <p className="mt-3 text-muted-foreground">
                Generate API key di dashboard, lalu panggil endpoint yang sama
                dari aplikasi Anda. Gateway yang memilihkan penyedianya.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              <CodeBlock title="Request" code={CURL_EXAMPLE} />
              <CodeBlock title="Response" code={RESPONSE_EXAMPLE} />
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              <code className="font-mono text-xs">attempts: 2</code> menandakan
              kunci pertama kena limit dan permintaan diteruskan otomatis —
              aplikasi Anda tetap menerima jawaban.
            </p>
          </div>
        </section>

        {/* Ajakan terakhir */}
        <section>
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col items-center gap-6 p-10 text-center sm:p-14">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Zap className="size-6" />
                </span>
                <div className="space-y-3">
                  <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                    Mulai dalam satu menit
                  </h2>
                  <p className="mx-auto max-w-lg text-pretty text-muted-foreground">
                    Daftar, tempel satu API key gratisan, generate kunci
                    FreeAll AI, dan aplikasi Anda sudah punya gateway AI dengan
                    fallback otomatis.
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/register"}>
                    {user ? "Buka dashboard" : "Daftar gratis"}
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Zap className="size-3" />
            </span>
            <span>FreeAll AI — Routing AI tanpa batas.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="transition-colors hover:text-foreground">
              Dokumentasi
            </Link>
            <span>Bisa di-self-host sepenuhnya.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-3xl font-semibold tabular-nums text-primary">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
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
