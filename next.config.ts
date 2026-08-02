import type { NextConfig } from "next";

/**
 * Header keamanan.
 *
 * Dikirim untuk semua rute. CSP sengaja tidak menyertakan `unsafe-inline`
 * pada `script-src`… kecuali untuk `'unsafe-eval'` yang dibutuhkan Turbopack
 * saat pengembangan — di produksi aturannya lebih ketat.
 */
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  // Cegah halaman ditanam di iframe situs lain (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Jangan biarkan peramban menebak tipe konten.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Jangan bocorkan URL lengkap ke situs lain saat pengguna mengeklik tautan.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Matikan API perangkat yang memang tidak dipakai aplikasi ini.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isProd
    ? [
        // Paksa HTTPS selama dua tahun setelah kunjungan pertama.
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // `unsafe-inline` dibutuhkan Next.js sendiri: payload React Server
            // Component dikirim lewat skrip inline `self.__next_f.push(...)`
            // pada setiap halaman. Menghapusnya butuh nonce per request, yang
            // menuntut proxy dan membuat semua halaman jadi dinamis.
            //
            // (Ini BUKAN lagi soal skrip pemasang tema — tema kini ditentukan
            // di server lewat cookie, tanpa skrip apa pun.)
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            // Panggilan ke penyedia AI terjadi di server, bukan di peramban,
            // jadi koneksi dari halaman cukup ke origin sendiri.
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
          ].join("; "),
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
