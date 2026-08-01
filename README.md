# FreeAll AI

> **Routing AI tanpa batas.** API Gateway open-source dengan sistem fallback cerdas.

FreeAll AI menyatukan banyak penyedia AI (Groq, Gemini, DeepSeek, Mistral, OpenRouter, …) di balik satu endpoint. Saat sebuah API key kena limit (HTTP 429), gateway otomatis meneruskan permintaan ke kunci berikutnya — aplikasi Anda tidak perlu tahu apa pun soal itu.

Konsepnya **Crowdsourced BYOK** (Bring Your Own Key): pengguna mendaftarkan API key tier-gratis mereka ke kolam bersama, dan sistem merutekan permintaan ke kunci yang masih punya kuota.

---

## Fitur

| | |
|---|---|
| **Tempel key, selesai** | Sistem mengenali penyedianya dari kuncinya, menanyakan model apa yang masih hidup, memilih yang terbaik, lalu mengujinya — tanpa Anda mengisi Base URL atau nama model. |
| **Fallback dua lapis** | Model utama kena limit → coba **model lain pada kunci yang sama** (kuota gratis dihitung per model). Semua model kunci itu habis → pindah ke kunci berikutnya. |
| **Menyembuhkan diri** | Model cadangan yang berhasil otomatis naik jadi model utama, jadi request berikutnya tidak lagi membuang percobaan ke model yang sedang habis. |
| **Multi-provider** | 13 preset (Groq, Gemini, **Claude**, OpenRouter, Cerebras, NVIDIA, xAI, Fireworks, OpenAI, DeepSeek, Mistral, Together, SambaNova) + endpoint kustom apa pun yang OpenAI-compatible. |
| **Enkripsi kunci** | API key penyedia dienkripsi AES-256-GCM sebelum masuk database. |
| **Kunci SaaS** | `sk-freeall-…` per aplikasi, disimpan sebagai hash — tidak bisa dibaca ulang. |
| **Rate limiting** | Kuota harian per API key (berbasis DB) + burst limiter per menit. |
| **Dashboard** | Kelola provider, API key, dan lihat riwayat request beserta jumlah percobaan fallback. |

---

## Stack

- **Next.js 16** (App Router, React 19, Server Actions)
- **PostgreSQL** + **Prisma ORM v7** (`prisma-client` generator + `@prisma/adapter-pg`)
- **Tailwind CSS v4** + komponen gaya shadcn
- **Autentikasi built-in** — scrypt + sesi berbasis cookie, tanpa dependency pihak ketiga

---

## Mulai

### 1. Prasyarat

- Node.js 20.19+ (proyek ini diuji di Node 26)
- PostgreSQL 14+

> **Catatan lingkungan ini:** Node dikelola FlyEnv dan hanya ter-export di `.bashrc`.
> Kalau memakai zsh, jalankan dulu:
> ```bash
> export PATH="$HOME/.config/FlyEnv/env/node/bin:$PATH"
> ```

### 2. Install & konfigurasi

```bash
npm install
cp .env.example .env
```

Isi `.env`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/freealldb?schema=public"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/freeall_shadow"
ENCRYPTION_KEY="$(npm run --silent gen:secret)"
```

> ⚠️ **Simpan `ENCRYPTION_KEY` baik-baik.** Kalau hilang atau berubah, semua ProviderKey yang sudah tersimpan tidak bisa didekripsi lagi dan harus dimasukkan ulang.

### 3. Siapkan database

```bash
npm run db:deploy     # terapkan migrasi
npm run db:generate   # generate Prisma Client
npm run dev
```

Buka <http://localhost:3000>, lalu daftar. **User pertama otomatis menjadi ADMIN.**

### 4. Tambahkan kunci provider

Masuk ke **Dashboard → Provider AI** dan cukup **tempel API key** Anda — biarkan penyedia pada "Deteksi otomatis". Sistem akan:

1. mengenali penyedianya dari bentuk kunci (`sk-ant-` → Claude, `gsk_` → Groq, `AIza`/`AQ.` → Gemini, dst.), atau mengujinya ke beberapa kandidat bila awalannya generik seperti `sk-…`;
2. menanyakan ke penyedia itu **model apa yang benar-benar hidup** untuk kunci Anda;
3. memilih model terbaik — mengutamakan yang bertanda `:free`, lalu alias `-latest` yang tidak ikut usang, lalu varian ringan (flash/mini/lite) yang kuotanya paling longgar;
4. menguji dengan satu panggilan nyata sebelum menyimpan.

Kunci yang gagal uji tetap disimpan tapi **dinonaktifkan** beserta alasannya, agar tidak memperlambat setiap request fallback.

> **Kenapa modelnya tidak dipatok saja?** Karena nama model cepat usang. Contoh nyata: `gemini-2.0-flash` masih terdaftar tapi kuota gratisnya sudah ditutup (429 dengan `limit: 0`), dan `gemini-2.5-flash` membalas 404 "no longer available". Menanyakan daftar model yang hidup jauh lebih tahan waktu daripada memercayai konstanta di kode.

Sebelum ada minimal satu ProviderKey aktif, `/api/v1/chat` akan membalas `503`.

---

## Pemakaian API

Generate kunci di **Dashboard → API Key** (nilai penuhnya hanya ditampilkan sekali).

### `POST /api/v1/chat`

```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Authorization: Bearer sk-freeall-xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Halo!"}'
```

Bentuk percakapan multi-giliran juga diterima:

```json
{
  "messages": [
    { "role": "system", "content": "Jawab dalam Bahasa Indonesia." },
    { "role": "user", "content": "Halo!" }
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "provider": "groq"
}
```

`provider` bersifat opsional — mengisinya membatasi fallback ke penyedia tersebut saja.

**Respons sukses:**

```json
{
  "success": true,
  "response": "Halo juga! Ada yang bisa saya bantu?",
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "attempts": 2,
  "latencyMs": 812,
  "usage": { "promptTokens": 8, "completionTokens": 12, "totalTokens": 20 },
  "fallbacks": [
    { "provider": "groq", "status": 429, "error": "Rate limit reached" }
  ]
}
```

`attempts: 2` dan isi `fallbacks` menunjukkan kunci pertama kena limit lalu permintaan diteruskan — inti dari sistem ini.

### Kode status

| Status | Arti |
|---|---|
| `400` | Body tidak valid |
| `401` | API key hilang, salah, atau sudah dinonaktifkan |
| `429` | Kuota harian atau burst limit terlampaui (lihat header `Retry-After`) |
| `503` | Tidak ada provider aktif, atau semua kunci gagal |

### Endpoint lain

- `GET /api/v1/models` — daftar provider/model yang siap melayani (butuh API key)
- `POST /api/demo/chat` — demo landing page, tanpa API key, dibatasi per IP

---

## Arsitektur

```
src/lib/ai/
├── interfaces/ai-strategy.interface.ts   Kontrak AiStrategy + klasifikasi error
├── providers.ts                          Katalog penyedia (baseUrl, model, pola kunci)
├── discovery.ts                          Deteksi penyedia + pemilihan model hidup
├── verify.ts                             Uji koneksi sekali sebelum menyimpan
├── strategies/
│   ├── universal.strategy.ts             Semua API berformat OpenAI
│   ├── gemini.strategy.ts                Format khusus Google Gemini
│   ├── anthropic.strategy.ts             Format khusus Anthropic (Claude)
│   └── http-error.ts                     Pesan error HTTP yang bisa ditindaklanjuti
├── factory/ai-factory.ts                 Merakit strategy dari baris database
└── ai-manager.ts                         Loop fallback + pembaruan status kunci
```

Menambah penyedia berformat OpenAI cukup dengan menambahkan satu entri di `providers.ts`. Penyedia dengan format request khas (seperti Gemini dan Claude) butuh satu kelas strategy baru — dan itulah satu-satunya tempat perbedaannya hidup.

**Alur satu request:**

1. `route.ts` memverifikasi kunci SaaS, lalu mengecek kuota harian dan burst limit
2. `AiManager` mengambil ProviderKey aktif, urut `priority desc, errorCount asc`
3. Untuk tiap kunci, untuk tiap model (`modelName` lalu `fallbackModels`): `AiFactory.create()` → `strategy.chat()`
4. **429 / 404** → model itu saja yang bermasalah, coba model berikutnya pada kunci yang sama
5. **401/403** → kunci ditolak permanen, dimatikan dan seluruh modelnya dilewati
6. **Sukses** → loop berhenti; bila yang berhasil adalah model cadangan, model itu dinaikkan jadi utama
7. Hasil dan jumlah percobaan dicatat ke `RequestLog`

Dibatasi `MAX_KEYS` (6 kunci) dan `MAX_ATTEMPTS` (10 percobaan kunci × model) agar latensi tetap terkendali.

### Kenapa fallback per model penting

Penyedia gratis menghitung kuota **per model**, bukan per akun. Gemini yang membalas
`429 … Quota exceeded for … model: gemini-2.0-flash` masih punya jatah di
`gemini-flash-lite-latest` dengan kunci yang sama. Tanpa lapis ini, satu kunci
yang kehabisan kuota akan langsung dianggap mati padahal belum.

Tidak ada kode fallback yang perlu diubah saat menambah penyedia.

> **Catatan Anthropic:** `AnthropicStrategy` sengaja **tidak** mengirim `temperature`. Model Claude generasi terbaru (Opus 5, Opus 4.8/4.7, Sonnet 5) menolak parameter sampling dengan HTTP 400, jadi meneruskannya justru akan mematikan kunci tersebut.

### Model data

- **User** — pengguna dashboard; user pertama menjadi ADMIN
- **Session** — sesi login; DB menyimpan hash token, cookie membawa nilai mentahnya
- **ApiKey** — kunci SaaS `sk-freeall-…`; disimpan sebagai hash + prefix tampilan
- **ProviderKey** — inti fallback; kunci terenkripsi + `baseUrl`/`modelName` yang bisa dikustomisasi
- **RequestLog** — riwayat eksekusi; jadi sumber statistik dashboard dan hitungan kuota harian

---

## Catatan keamanan

- Kunci penyedia dienkripsi AES-256-GCM (authenticated encryption); yang tersimpan di kolom unik hanya SHA-256-nya, untuk mencegah duplikat
- Kunci SaaS tidak pernah disimpan dalam bentuk asli — tidak bisa dipulihkan, hanya bisa diganti
- Password di-hash dengan scrypt dan diverifikasi memakai `timingSafeEqual`
- Setiap Server Action memanggil `requireUser()` dan memfilter query dengan `userId`, karena Server Action bisa dipicu lewat POST langsung tanpa melewati UI
- Burst limiter berjalan di memori proses, jadi **hanya berlaku per instance**. Untuk penegakan ketat di deployment multi-replica, ganti bagian itu di `src/lib/rate-limit.ts` dengan Redis. Kuota harian tetap akurat karena dihitung dari database.

---

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server pengembangan |
| `npm run build` | Build produksi |
| `npm run db:migrate` | Buat + terapkan migrasi (butuh shadow DB) |
| `npm run db:deploy` | Terapkan migrasi yang sudah ada |
| `npm run db:studio` | Buka Prisma Studio |
| `npm run db:seed` | Buat akun admin awal |
| `npm run gen:secret` | Generate nilai `ENCRYPTION_KEY` |

---

## Lisensi

Open source — silakan self-host sepenuhnya.
