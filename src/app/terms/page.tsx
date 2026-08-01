import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Syarat & Ketentuan · FreeAll AI",
  description:
    "Aturan pemakaian FreeAll AI: tanggung jawab atas API key, batas layanan, dan larangan penyalahgunaan.",
};

export default function TermsPage() {
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
        <Badge variant="outline">Syarat &amp; Ketentuan</Badge>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight">
          Aturan pemakaian
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Dengan memakai FreeAll AI, Anda menyetujui hal-hal berikut.
        </p>

        <Alert variant="warning" className="mt-8">
          <TriangleAlert />
          <AlertDescription>
            FreeAll AI adalah perantara. Kami tidak menjalankan model AI sendiri
            — setiap permintaan diteruskan ke penyedia pihak ketiga memakai API
            key yang Anda atau admin daftarkan, dan tunduk pada ketentuan mereka.
          </AlertDescription>
        </Alert>

        <div className="mt-12 space-y-10">
          <Section title="1. API key yang Anda daftarkan">
            <p>
              Anda menyatakan berhak memakai setiap API key yang Anda daftarkan,
              dan bahwa pemakaiannya lewat FreeAll AI tidak melanggar ketentuan
              penyedia asalnya. Anda bertanggung jawab penuh atas biaya, kuota,
              dan konsekuensi pemakaian kunci tersebut.
            </p>
            <p>
              Kunci yang ditandai <strong>publik</strong> akan dipakai pengguna
              lain dan pengunjung demo. Tandai sebagai publik hanya kalau Anda
              memang bersedia kuotanya dipakai bersama.
            </p>
          </Section>

          <Section title="2. Batas layanan dan kuota">
            <p>
              Kuota harian, batas lonjakan, dan jumlah API key mengikuti paket
              yang aktif. Batas ini bisa kami sesuaikan sewaktu-waktu — terutama
              pada paket gratis — untuk menjaga layanan tetap berjalan bagi
              semua pengguna.
            </p>
            <p>
              Ketersediaan bergantung pada penyedia pihak ketiga. Kami tidak
              menjanjikan tingkat ketersediaan (SLA) tertentu pada paket gratis.
            </p>
          </Section>

          <Section title="3. Yang dilarang">
            <ul className="space-y-2">
              <li>
                • Mendaftarkan API key yang bukan milik Anda atau yang diperoleh
                tanpa izin.
              </li>
              <li>
                • Berusaha mengakses kunci, data, atau akun pengguna lain.
              </li>
              <li>
                • Memakai layanan untuk aktivitas melanggar hukum, atau yang
                dilarang oleh ketentuan penyedia AI yang bersangkutan.
              </li>
              <li>
                • Membuat banyak akun untuk menghindari batas kuota.
              </li>
              <li>
                • Membebani layanan secara otomatis di luar batas yang wajar.
              </li>
            </ul>
            <p>
              Pelanggaran dapat berakibat penonaktifan API key atau penghapusan
              akun tanpa pemberitahuan sebelumnya.
            </p>
          </Section>

          <Section title="4. Isi percakapan">
            <p>
              Anda bertanggung jawab atas prompt yang dikirim dan jawaban yang
              Anda gunakan. Jawaban model AI bisa keliru, bias, atau mengada-ada
              — jangan dijadikan satu-satunya dasar keputusan penting, terutama
              di bidang medis, hukum, atau keuangan.
            </p>
          </Section>

          <Section title="5. Langganan dan pembayaran">
            <p>
              Paket berbayar berlaku sampai tanggal berakhirnya, lalu akun
              kembali ke paket gratis. Kunci provider dan API key Anda tidak
              dihapus saat langganan berakhir. Pembayaran yang sudah masuk tidak
              dikembalikan, kecuali layanan memang tidak dapat kami sediakan.
            </p>
          </Section>

          <Section title="6. Batas tanggung jawab">
            <p>
              Layanan disediakan apa adanya. Kami tidak bertanggung jawab atas
              kerugian yang timbul dari kuota yang habis, kunci yang
              dinonaktifkan penyedia, gangguan pihak ketiga, atau keputusan yang
              diambil berdasarkan jawaban model AI.
            </p>
          </Section>

          <Section title="7. Self-hosted">
            <p>
              Ketentuan ini berlaku untuk instance yang kami operasikan. Kalau
              Anda memasang FreeAll AI di server sendiri, Anda yang bertanggung
              jawab penuh atas operasional, keamanan, dan kepatuhannya.
            </p>
          </Section>

          <Section title="8. Perubahan">
            <p>
              Ketentuan ini dapat berubah. Perubahan berarti berlaku sejak
              diumumkan di halaman ini. Dengan terus memakai layanan setelah
              perubahan, Anda dianggap menyetujuinya.
            </p>
          </Section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
