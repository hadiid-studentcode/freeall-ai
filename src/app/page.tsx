import Link from "next/link";
import {
  ArrowRight,
  Code,
  Factory,
  Layers,
  Repeat,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { DemoChat } from "@/components/chat/demo-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PROVIDER_PRESETS } from "@/lib/ai/providers";
import { getCurrentUser } from "@/lib/auth/session";

const PATTERNS = [
  {
    icon: Layers,
    title: "Strategy Pattern",
    body: "Setiap penyedia mematuhi satu kontrak AiStrategy. UniversalStrategy menangani ratusan API berformat OpenAI, GeminiStrategy mengurung format unik Google.",
  },
  {
    icon: Factory,
    title: "Factory Pattern",
    body: "AiFactory merakit objek penyedia dari baris database. Kolom baseUrl dan modelName membuat penyedia baru bisa ditambahkan tanpa menyentuh kode.",
  },
  {
    icon: Repeat,
    title: "Fallback Manager",
    body: "AiManager menelusuri kunci aktif sesuai prioritas. Kena 429 dicatat lalu lanjut; kena 401 kuncinya dimatikan otomatis.",
  },
];

const CURL_EXAMPLE = `curl -X POST https://localhost:3000/api/v1/chat \\
  -H "Authorization: Bearer sk-freeall-xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Halo!"}'`;

const RESPONSE_EXAMPLE = `{
  "success": true,
  "response": "Halo juga! Ada yang bisa saya bantu?",
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "attempts": 2,
  "latencyMs": 812
}`;

export default async function Home() {
  const user = await getCurrentUser();
  const providers = PROVIDER_PRESETS.filter((preset) => preset.id !== "custom");

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

      <main className="mx-auto max-w-7xl space-y-24 px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero + demo */}
        <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="gap-1.5">
              <Code className="size-3" />
              Open source · Self-hosted &amp; SaaS
            </Badge>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Routing AI{" "}
              <span className="text-primary">tanpa batas</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              API Gateway dengan sistem fallback cerdas. Daftarkan API key
              gratisan Anda dari Groq, Gemini, DeepSeek, dan lainnya — saat satu
              kunci kena limit, permintaan otomatis diteruskan ke kunci
              berikutnya.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={user ? "/dashboard" : "/register"}>
                  {user ? "Buka dashboard" : "Mulai gratis"}
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#api">Lihat contoh API</a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground">
                Preset siap pakai:
              </span>
              {providers.map((preset) => (
                <Badge key={preset.id} variant="secondary">
                  {preset.label}
                </Badge>
              ))}
            </div>
          </div>

          <DemoChat />
        </section>

        {/* Arsitektur */}
        <section className="space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">
              Arsitektur yang rapi, bukan tumpukan if-else
            </h2>
            <p className="mt-3 text-muted-foreground">
              Logika AI dipisah memakai pola desain standar industri, sehingga
              menambah penyedia baru tidak menuntut perubahan pada logika
              fallback.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PATTERNS.map((pattern) => (
              <Card key={pattern.title}>
                <CardContent className="p-6">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <pattern.icon className="size-4" />
                  </span>
                  <h3 className="mt-4 font-semibold">{pattern.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {pattern.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contoh API */}
        <section id="api" className="space-y-8 scroll-mt-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">
              Satu endpoint, semua penyedia
            </h2>
            <p className="mt-3 text-muted-foreground">
              Generate API key di dashboard, lalu panggil endpoint yang sama
              dari aplikasi Anda. Gateway yang memilihkan penyedianya.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock title="Request" code={CURL_EXAMPLE} />
            <CodeBlock title="Response" code={RESPONSE_EXAMPLE} />
          </div>

          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-6">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                Kunci penyedia dienkripsi AES-256-GCM sebelum disimpan, kunci
                SaaS hanya disimpan sebagai hash, dan setiap API key punya kuota
                harian sendiri.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href={user ? "/dashboard/api-keys" : "/register"}>
                  {user ? "Kelola API key" : "Buat API key"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>FreeAll AI — Routing AI tanpa batas.</p>
          <p>Open source, bisa di-self-host sepenuhnya.</p>
        </div>
      </footer>
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
