import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Heart, Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPrice, PLAN_ORDER, PLANS, resolvePlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Harga · FreeAll AI",
  description:
    "Pakai gratis dengan API key Anda sendiri, atau berlangganan untuk kuota Provider Publik yang lebih besar.",
};

const FAQ = [
  {
    q: "Kalau saya pakai API key sendiri, apakah tetap kena batas?",
    a: "Tidak. Batas kuota harian hanya berlaku saat Anda memakai Provider Publik — yaitu kunci milik kami. Begitu Anda menambahkan kunci sendiri, kuotanya milik Anda sepenuhnya dan kami tidak membatasinya.",
  },
  {
    q: "Apa bedanya dengan menjalankan sendiri?",
    a: "Tidak ada yang dikunci. Kode ini bisa Anda pasang di server sendiri dan seluruh fiturnya jalan. Yang kami jual adalah layanan terkelola: kuota dari kunci kami, riwayat yang disimpan lebih lama, dan Anda tidak perlu mengurus server maupun kunci provider.",
  },
  {
    q: "Bisa berhenti kapan saja?",
    a: "Bisa. Langganan berlaku sampai tanggal berakhirnya, setelah itu akun kembali ke paket Gratis. Kunci provider dan API key Anda tidak dihapus.",
  },
  {
    q: "Fitur inti apakah dibatasi di paket gratis?",
    a: "Tidak. Fallback antar model dan kunci, deteksi penyedia otomatis, dan enkripsi kunci tersedia di semua paket — termasuk gratis. Yang membedakan hanya kapasitas.",
  },
];

export default async function PricingPage() {
  const user = await getCurrentUser();

  const account = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { plan: true, planExpiresAt: true },
      })
    : null;
  const currentPlan = account ? resolvePlan(account) : null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              className="hidden px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Dokumentasi
            </Link>
            <Button asChild size="sm">
              <Link href={user ? "/dashboard" : "/register"}>
                {user ? "Dashboard" : "Daftar gratis"}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline">Harga</Badge>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Bayar hanya kalau butuh kapasitas lebih
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Dengan API key Anda sendiri, gateway ini gratis dipakai — tanpa
            batas dari kami. Berlangganan hanya kalau Anda ingin memakai kunci
            kami, riwayat yang lebih panjang, atau kapasitas yang lebih besar.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id];
            const isCurrent = currentPlan?.id === plan.id;

            return (
              <Card
                key={plan.id}
                className={
                  plan.highlight
                    ? "relative border-primary/50 shadow-lg shadow-primary/5"
                    : "relative"
                }
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Paling banyak dipilih</Badge>
                  </span>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-xl">{plan.label}</CardTitle>
                    {isCurrent && <Badge variant="secondary">Paket Anda</Badge>}
                  </div>
                  <CardDescription>{plan.tagline}</CardDescription>
                  <p className="pt-3">
                    <span className="text-3xl font-semibold tabular-nums">
                      {formatPrice(plan.pricePerMonth)}
                    </span>
                    {plan.pricePerMonth > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        / bulan
                      </span>
                    )}
                  </p>
                </CardHeader>

                <CardContent className="space-y-5">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="space-y-1.5 border-t border-border pt-4 text-xs">
                    <Row
                      label="Kuota Provider Publik"
                      value={`${formatNumber(plan.publicDailyLimit)} / hari`}
                    />
                    <Row label="API key" value={formatNumber(plan.maxApiKeys)} />
                    <Row
                      label="Riwayat"
                      value={`${formatNumber(plan.logRetentionDays)} hari`}
                    />
                    <Row
                      label="Batas lonjakan"
                      value={`${formatNumber(plan.burstPerMinute)} / menit`}
                    />
                  </dl>

                  <Button
                    asChild
                    variant={plan.highlight ? "default" : "outline"}
                    className="w-full"
                    disabled={isCurrent}
                  >
                    <Link href={user ? "/dashboard" : "/register"}>
                      {isCurrent
                        ? "Paket aktif"
                        : plan.pricePerMonth === 0
                          ? "Mulai gratis"
                          : `Pilih ${plan.label}`}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Peningkatan paket masih manual selama pembayaran belum tersambung. */}
        <Card className="mt-6">
          <CardContent className="flex flex-wrap items-center gap-4 p-6">
            <Server className="size-5 shrink-0 text-primary" />
            <p className="min-w-0 flex-1 text-sm text-muted-foreground">
              Pembayaran otomatis belum tersambung. Untuk sementara, peningkatan
              paket diaktifkan manual oleh admin setelah konfirmasi — hubungi
              kami setelah mendaftar.
            </p>
          </CardContent>
        </Card>

        {/* Donasi */}
        <Card className="mt-16">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Heart className="size-6" />
            </span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Memakai versi gratis dan merasa terbantu?
              </h2>
              <p className="mx-auto max-w-lg text-pretty text-muted-foreground">
                Donasi membantu menutup biaya server dan kunci provider yang
                dipakai bersama, sehingga paket gratis tetap bisa berjalan untuk
                semua orang.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a
                href="https://saweria.co/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Heart />
                Beri dukungan
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Pertanyaan yang sering muncul
          </h2>
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
            {FAQ.map((item) => (
              <Card key={item.q}>
                <CardContent className="p-5">
                  <h3 className="font-medium">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
