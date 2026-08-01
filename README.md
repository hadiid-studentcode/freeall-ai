# FreeAll AI

> **Routing AI tanpa batas.** API Gateway dengan sistem fallback cerdas.

FreeAll AI berdiri di antara aplikasi Anda dan puluhan penyedia AI. Aplikasi memanggil **satu endpoint**; gateway yang mengurus kunci mana yang dipakai, model mana yang masih punya kuota, dan apa yang dilakukan saat sebuah kunci kehabisan jatah.

Konsepnya **Crowdsourced BYOK** (Bring Your Own Key): daftarkan API key tier-gratis Anda, dan sistem merutekan permintaan ke kunci yang masih punya sisa kuota.

---

## Kenapa ini ada

Penyedia AI gratis menghitung kuota **per model**, bukan per akun. Satu kunci Gemini yang membalas `429` pada `gemini-2.0-flash` sering masih punya jatah di `gemini-flash-lite-latest`. Nama model juga cepat usang — model yang kemarin jalan bisa membalas `404 no longer available` hari ini.

FreeAll AI menangani keduanya secara otomatis, sehingga aplikasi Anda tidak perlu tahu.

---

## Fitur

| | |
|---|---|
| **Tempel key, selesai** | Penyedia dikenali dari bentuk kuncinya, model yang masih hidup ditanyakan langsung ke sumbernya, lalu diuji sekali sebelum disimpan. |
| **Fallback dua lapis** | Model kena limit → coba model lain pada kunci yang sama. Semua model habis → pindah ke kunci berikutnya. |
| **Menyembuhkan diri** | Model cadangan yang berhasil otomatis naik jadi model utama. |
| **13+ penyedia** | Groq, Gemini, Claude, OpenRouter, Cerebras, NVIDIA, xAI, Fireworks, OpenAI, DeepSeek, Mistral, Together, SambaNova — plus penyedia kustom yang bisa ditambah admin tanpa deploy ulang. |
| **Isolasi kunci** | Kunci pribadi hanya dipakai pemiliknya. Kunci publik dikelola admin dan dibagi bersama. |
| **Paket berlangganan** | FREE / PRO / TEAM dengan batas kuota, API key, retensi riwayat, dan lonjakan. |
| **Enkripsi** | Kunci provider dienkripsi AES-256-GCM. Kunci SaaS disimpan sebagai hash. |
| **Dwibahasa** | Bahasa Indonesia dan Inggris. |
| **Tema** | Terang, gelap, atau ikut sistem. |

---

## Stack

- **Next.js 16** (App Router, React 19, Server Actions)
- **PostgreSQL** + **Prisma ORM v7** (`prisma-client` generator + `@prisma/adapter-pg`)
- **Tailwind CSS v4** + komponen gaya shadcn
- **Autentikasi built-in** — scrypt + sesi berbasis cookie, tanpa dependency pihak ketiga

---

## Mulai

### Prasyarat

- Node.js 20.19+
- PostgreSQL 14+

> **Catatan lingkungan ini:** Node dikelola FlyEnv dan hanya ter-export di `.bashrc`. Kalau memakai zsh:
> ```bash
> export PATH="$HOME/.config/FlyEnv/env/node/bin:$PATH"
> ```

### Pasang

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

> ⚠️ **Simpan `ENCRYPTION_KEY` baik-baik.** Kalau hilang atau berubah, semua ProviderKey yang tersimpan tidak bisa didekripsi lagi.

### Jalankan

```bash
npm run db:deploy     # terapkan migrasi
npm run db:generate   # generate Prisma Client
npm run dev
```

Buka <http://localhost:3000> lalu daftar. **User pertama otomatis menjadi ADMIN.**

### Tambahkan kunci provider

**Dashboard → Provider AI**, tempel API key, biarkan penyedia pada "Deteksi otomatis". Sistem akan mengenali penyedia, mencari model yang hidup, memilih yang terbaik, dan mengujinya.

---

## Pemakaian API

Generate kunci di **Dashboard → API Key** (nilai penuhnya hanya ditampilkan sekali), lalu uji lewat **Dashboard → Playground** tanpa menulis kode.

```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Authorization: Bearer sk-freeall-xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Halo!"}'
```

```json
{
  "success": true,
  "response": "Halo juga!",
  "provider": "groq",
  "model": "llama-3.1-8b-instant",
  "attempts": 3,
  "latencyMs": 812,
  "fallbacks": [
    { "provider": "gemini", "status": 429, "error": "Quota exceeded" }
  ]
}
```

`attempts: 3` berarti dua percobaan sebelumnya gagal dan permintaan diteruskan otomatis.

Bentuk `messages` untuk percakapan multi-giliran juga diterima, beserta `temperature`, `max_tokens`, dan `provider`.

### Endpoint

| Endpoint | Keterangan |
|---|---|
| `POST /api/v1/chat` | Endpoint utama. Butuh API key. |
| `GET /api/v1/models` | Daftar provider/model aktif. Butuh API key. |
| `POST /api/demo/chat` | Demo landing page. Tanpa API key, dibatasi ketat. |

### Kode status

| Kode | Arti |
|---|---|
| `400` | Body tidak valid |
| `401` | API key hilang, salah, atau dinonaktifkan |
| `429` | Kuota harian, kuota publik, atau batas lonjakan terlampaui |
| `503` | Tidak ada kunci yang bisa dipakai, atau semuanya gagal |

---

## Arsitektur

```
src/lib/ai/
├── interfaces/ai-strategy.interface.ts   Kontrak AiStrategy + klasifikasi error
├── providers.ts                          Preset bawaan (baseUrl, model, pola kunci)
├── catalog.ts                            Gabungan preset bawaan + penyedia dari admin
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

**Alur satu request:** autentikasi → rate limit → `AiManager` (kunci × model) → penyedia AI → `RequestLog`.

Dibatasi `MAX_KEYS` (6 kunci) dan `MAX_ATTEMPTS` (10 percobaan) agar latensi terkendali.

Menambah penyedia berformat OpenAI cukup satu entri di `providers.ts` — atau lewat dashboard admin, tanpa deploy. Penyedia dengan format khas (Gemini, Claude) butuh satu kelas strategy baru.

> **Catatan Anthropic:** `AnthropicStrategy` sengaja tidak mengirim `temperature`. Model Claude terbaru menolak parameter sampling dengan HTTP 400.

### Model data

| Model | Isi |
|---|---|
| `User` | Akun; user pertama jadi ADMIN. Punya `plan` dan `planExpiresAt`. |
| `Session` | Sesi login; DB menyimpan hash token. |
| `ApiKey` | Kunci SaaS `sk-freeall-…`; disimpan sebagai hash + prefix tampilan. |
| `ProviderKey` | Inti fallback; kunci terenkripsi, `fallbackModels`, dan `scope` (PRIVATE/SHARED). |
| `RequestLog` | Riwayat eksekusi; sumber statistik dan kuota harian. |
| `CustomProvider` | Penyedia tambahan yang didaftarkan admin. |
| `Setting` | Pengaturan yang bisa diubah admin tanpa deploy. |

---

## Keamanan

- Kunci provider dienkripsi **AES-256-GCM**; yang disimpan di kolom unik hanya SHA-256-nya
- Kunci SaaS tidak pernah disimpan dalam bentuk asli
- Password di-hash **scrypt**, diverifikasi dengan `timingSafeEqual`
- Setiap Server Action memanggil `requireUser()`/`requireAdmin()` dan memfilter query dengan `userId` — Server Action bisa dipicu POST langsung tanpa melewati UI
- **Penjaga SSRF**: Base URL penyedia diresolusi DNS-nya dan ditolak kalau mengarah ke loopback, jaringan privat, atau link-local (termasuk endpoint metadata cloud)
- **Pembatas percobaan masuk**: 8 kegagalan per email dan 24 per IP dalam 15 menit
- Header keamanan: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, plus HSTS dan CSP di produksi

**Batasan yang perlu diketahui:**

- Burst limiter berjalan di memori proses, jadi hanya berlaku **per instance**. Untuk penegakan ketat di deployment multi-replica, ganti bagian itu di `src/lib/rate-limit.ts` dengan Redis. Kuota harian tetap akurat karena berbasis database.
- Penjaga SSRF mengurangi risiko, bukan menghapusnya (masih ada celah teoretis DNS rebinding). Untuk penjagaan penuh, batasi tujuan di tingkat jaringan lewat proxy egress.

---

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run db:migrate` | Buat + terapkan migrasi (butuh shadow DB) |
| `npm run db:deploy` | Terapkan migrasi yang sudah ada |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Buat akun admin awal |
| `npm run gen:secret` | Generate `ENCRYPTION_KEY` |

---

## Dokumen lain

- [`docs/MODEL-BISNIS.md`](docs/MODEL-BISNIS.md) — posisi produk, model pendapatan, dan pegangan untuk bicara ke calon pengguna atau investor
- `/docs` di aplikasi — penjelasan visual cara kerja sistem, lengkap dengan diagram alur
