import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck, TriangleAlert } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Kebijakan Privasi · FreeAll AI",
  description:
    "Data apa yang kami simpan, bagaimana API key Anda dilindungi, dan ke mana prompt Anda dikirim.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Badge variant="outline">Kebijakan Privasi</Badge>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight">
          Data Anda, dan apa yang kami lakukan dengannya
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Ditulis sesingkat mungkin dan tanpa bahasa berbelit, karena Anda
          menitipkan sesuatu yang sensitif: API key milik Anda sendiri.
        </p>

        <Alert variant="warning" className="mt-8">
          <TriangleAlert />
          <AlertDescription>
            <strong>Jangan kirim data rahasia lewat prompt.</strong> Isi
            percakapan Anda diteruskan ke penyedia AI pihak ketiga (Groq,
            Google, Anthropic, dan lainnya) dan tunduk pada kebijakan
            penyimpanan mereka masing-masing, di luar kendali kami.
          </AlertDescription>
        </Alert>

        <div className="mt-12 space-y-12">
          <Section id="keamanan" title="Bagaimana API key provider disimpan">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="p-5">
                  <ShieldCheck className="size-5 text-primary" />
                  <h3 className="mt-3 font-semibold">Dienkripsi, bukan disandi</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Kunci provider dienkripsi dengan AES-256-GCM sebelum masuk
                    database. Yang tersimpan di kolom unik hanya SHA-256-nya,
                    dipakai untuk mencegah kunci yang sama didaftarkan dua kali.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <KeyRound className="size-5 text-primary" />
                  <h3 className="mt-3 font-semibold">Tidak bisa dibaca ulang</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Kunci API FreeAll AI (`sk-freeall-…`) hanya disimpan sebagai
                    hash. Kami tidak bisa menampilkannya lagi — bahkan kepada
                    Anda. Kalau hilang, kunci lama dihapus dan dibuat yang baru.
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Di dashboard, kunci hanya ditampilkan sebagai potongan seperti{" "}
              <code className="font-mono text-xs">gsk_yD…f1YV</code> — cukup
              untuk mengenalinya, tidak cukup untuk dipakai.
            </p>
          </Section>

          <Section title="Data yang kami simpan">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <Item label="Akun">
                Email, nama (opsional), dan kata sandi yang di-hash dengan
                scrypt. Kata sandi asli tidak pernah disimpan.
              </Item>
              <Item label="Kunci provider">
                Terenkripsi, beserta penyedia, model, dan statistik pemakaian.
              </Item>
              <Item label="Riwayat request">
                Waktu, penyedia, model, berhasil atau tidak, jumlah percobaan,
                dan lama respons. <strong>Isi prompt dan jawaban tidak
                disimpan.</strong>
              </Item>
              <Item label="Sesi login">
                Token sesi disimpan sebagai hash; cookie di peramban Anda yang
                membawa nilai aslinya.
              </Item>
            </ul>
          </Section>

          <Section title="Yang tidak kami lakukan">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Tidak menjual atau membagikan data Anda ke pihak ketiga.</li>
              <li>• Tidak memakai prompt Anda untuk melatih model apa pun.</li>
              <li>
                • Tidak memakai kunci pribadi Anda untuk melayani permintaan
                pengguna lain. Kunci hanya dipakai bersama kalau Anda —
                atau admin, untuk kuncinya sendiri — menandainya sebagai publik.
              </li>
            </ul>
          </Section>

          <Section title="Pihak ketiga">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Setiap prompt diteruskan ke penyedia AI yang kuncinya dipakai.
              Mereka punya kebijakan privasi dan masa simpan sendiri. Kami tidak
              mengendalikan apa yang mereka lakukan dengan data itu, jadi
              perlakukan setiap prompt seolah akan dibaca pihak lain.
            </p>
          </Section>

          <Section title="Menghapus data">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Anda bisa menghapus kunci provider dan API key kapan saja lewat
              dashboard; penghapusan berlaku langsung. Untuk menghapus seluruh
              akun beserta datanya, hubungi admin instance ini.
            </p>
          </Section>

          <Section title="Self-hosted">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Kalau Anda memasang FreeAll AI di server sendiri, seluruh data
              berada di infrastruktur Anda dan kebijakan ini tidak berlaku —
              Andalah pengendali datanya. Simpan{" "}
              <code className="font-mono text-xs">ENCRYPTION_KEY</code>{" "}
              baik-baik: tanpa itu, kunci yang sudah tersimpan tidak bisa
              didekripsi lagi.
            </p>
          </Section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Item({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <strong className="text-foreground">{label}.</strong> {children}
    </li>
  );
}
