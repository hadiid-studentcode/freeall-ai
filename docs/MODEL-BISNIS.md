# FreeAll AI — Model Bisnis & Pegangan Bicara

Dokumen internal. Isinya: apa yang dijual, kepada siapa, kenapa orang mau membayar, dan bagaimana menjelaskannya dalam satu tarikan napas.

---

## 1. Satu kalimat

> **FreeAll AI adalah API Gateway yang menyatukan API key gratisan dari berbagai penyedia AI di satu endpoint, dan otomatis berpindah saat satu kunci kehabisan kuota.**

Kalau hanya punya 10 detik, itu saja. Kalau punya 30 detik, tambahkan masalahnya:

> "Penyedia AI gratis punya kuota kecil dan gampang habis. Kalau habis, aplikasi Anda mati. FreeAll AI menyimpan banyak kunci sekaligus dan pindah otomatis, jadi aplikasi Anda tidak pernah tahu ada yang habis."

---

## 2. Masalah yang diselesaikan

Tiga masalah nyata, semuanya bisa dibuktikan dengan data:

| Masalah | Bukti | Yang dilakukan FreeAll AI |
|---|---|---|
| **Kuota gratis cepat habis** | Gemini free tier membalas `429 Quota exceeded` | Pindah ke model lain pada kunci yang sama, lalu ke kunci lain |
| **Nama model cepat usang** | `gemini-2.5-flash` → `404 no longer available`; `gemini-2.0-flash` → free tier ditutup (`limit: 0`) | Menanyakan daftar model yang hidup langsung ke penyedia, bukan memakai konstanta di kode |
| **Tiap penyedia beda format** | OpenAI, Gemini, dan Anthropic punya bentuk request berbeda | Satu endpoint; perbedaan formatnya dikurung di dalam gateway |

Poin ketiga sering diremehkan, padahal itu yang membuat orang enggan berpindah penyedia saat kuotanya habis.

---

## 3. Siapa penggunanya

| Segmen | Kebutuhan | Kenapa FreeAll AI cocok |
|---|---|---|
| **Developer indie & mahasiswa** | Bikin proyek AI tanpa biaya | Kumpulkan beberapa kunci gratis, dapat kuota gabungan |
| **Startup tahap awal** | Belum sanggup bayar OpenAI, tapi butuh keandalan | Fallback otomatis mencegah aplikasi mati saat kuota habis |
| **Agensi & freelancer** | Banyak klien, banyak proyek | Satu API key per aplikasi, kuota terpisah, riwayat per proyek |
| **Tim internal perusahaan** | Butuh kontrol dan jejak audit | Kunci terpusat, log lengkap, isolasi antar anggota |

**Pengguna paling awal yang realistis:** developer Indonesia yang sedang membangun proyek AI dan sudah punya beberapa kunci gratisan yang berserakan.

---

## 4. Model pendapatan

### Prinsip: yang dijual adalah kapasitas, bukan kemampuan

Kode sumber bersifat tertutup. **Yang dijual bukan perangkat lunaknya, melainkan layanan terkelola** — kuota dari kunci milik operator, riwayat yang disimpan lebih lama, dan kapasitas yang lebih longgar.

Ini menentukan cara membatasi paket:

- Yang dibatasi hanya hal yang menimbulkan biaya nyata bagi operator: kuota Provider Publik, retensi riwayat, batas lonjakan, jumlah API key.
- Orang yang tidak mau mengurus server, database, dan mengumpulkan kunci sendiri akan membayar. Itulah seluruh pasar Anda.

> **Catatan kepercayaan.** Produk ini menyimpan API key milik orang lain. Dengan kode tertutup, klaim keamanan tidak bisa diverifikasi siapa pun dari luar, sehingga kepercayaan harus dibangun lewat jalan lain: kebijakan privasi yang jelas, laporan audit keamanan pihak ketiga, atau halaman status. Ini biaya nyata dari memilih kode tertutup, dan sebaiknya diperhitungkan sejak awal.

### Yang TIDAK dibatasi di paket gratis

Fallback, deteksi penyedia otomatis, enkripsi kunci, jumlah kunci pribadi.

**Alasannya penting untuk dipahami:** melumpuhkan fitur inti membuat pengguna tidak pernah merasakan nilai produk, dan Anda kehilangan calon pelanggan sebelum sempat mengenalnya. Yang dijual adalah **kapasitas**, bukan kemampuan.

### Paket

| | Gratis | Pro — Rp49.000/bln | Team — Rp199.000/bln |
|---|---|---|---|
| Kuota Provider Publik | 50/hari | 2.000/hari | 10.000/hari |
| API key | 2 | 10 | 50 |
| Riwayat | 7 hari | 90 hari | 1 tahun |
| Batas lonjakan | 20/menit | 60/menit | 120/menit |
| Kunci sendiri | Tanpa batas | Tanpa batas | Tanpa batas |

**Aturan emas yang harus selalu disebut:** kalau pengguna membawa API key sendiri, **tidak ada batas kuota harian dari kami**. Batas hanya berlaku saat mereka memakai kunci milik operator. Ini jujur, mudah dipahami, dan menghilangkan kecurigaan bahwa produk sengaja dibikin sempit.

### Sumber pendapatan lain

| Sumber | Perkiraan porsi | Catatan |
|---|---|---|
| Langganan Pro/Team | 85–95% | Tulang punggung |
| Donasi | < 5% | Pelengkap, jangan diandalkan |
| Lisensi on-premise + dukungan | 5–10% | Untuk perusahaan yang wajib memasang di infrastruktur sendiri; dijual per kontrak, bukan diunduh bebas |

---

## 5. Kenapa orang mau membayar

Jawaban yang benar **bukan** "karena fiturnya lebih banyak". Yang benar:

1. **Tidak perlu mengumpulkan kunci sendiri.** Paket berbayar memakai kunci operator. Pengguna tinggal pakai.
2. **Tidak perlu mengurus server.** Tidak ada database, tidak ada deploy, tidak ada `ENCRYPTION_KEY` yang harus dijaga.
3. **Riwayat lebih panjang.** Kalau ada masalah produksi minggu lalu, datanya masih ada.
4. **Kapasitas lebih besar.** Aplikasi yang sudah dipakai orang butuh lebih dari 50 request/hari.

---

## 6. Pembeda dari alternatif

| Alternatif | Kelemahannya | Posisi FreeAll AI |
|---|---|---|
| Pakai satu penyedia langsung | Mati saat kuota habis | Fallback lintas penyedia |
| OpenRouter | Berbayar per token, bukan mengumpulkan kunci gratis | Fokus pada kunci gratisan milik pengguna |
| LiteLLM (sumber terbuka) | Perlu dikonfigurasi manual, tanpa UI | Deteksi otomatis + dashboard siap pakai |
| Bikin fallback sendiri | Perlu waktu, dan model cepat usang | Sudah jadi, dan daftar model diperbarui otomatis |

**Pembeda paling tajam yang layak diulang:** fallback **per model**, bukan hanya per kunci. Kompetitor umumnya berpindah kunci saat kena 429 — padahal kuota gratis dihitung per model, jadi kunci itu sering masih punya sisa jatah di model lain.

---

## 7. Cara menjelaskan (naskah singkat)

**Ke developer (30 detik):**

> "Kamu punya kunci gratis Groq, Gemini, sama DeepSeek yang tercecer? Daftarkan semuanya ke FreeAll AI, nanti aplikasimu cukup panggil satu endpoint. Kalau Gemini kena limit, otomatis pindah ke model lain di kunci yang sama — kalau habis semua, baru pindah ke Groq. Kodemu nggak perlu diubah sama sekali."

**Ke non-teknis (30 detik):**

> "Layanan AI gratis itu ada jatah harian. Kalau jatahnya habis, aplikasi yang memakainya ikut mati. FreeAll AI menyimpan banyak jatah sekaligus dan otomatis pindah ke yang masih ada. Seperti punya beberapa kartu, dan mesinnya otomatis memilih yang saldonya masih cukup."

**Ke calon investor (60 detik):**

> "Pasar AI dibanjiri penyedia baru dengan tier gratis, tapi kuotanya kecil dan sering berubah. Developer akhirnya menulis logika fallback sendiri — berulang-ulang, di tiap proyek. FreeAll AI menjadikannya infrastruktur. Pendapatannya dari langganan layanan terkelola, dan biaya marginal per pengguna gratis mendekati nol karena mereka membawa kunci sendiri — jadi pertumbuhan tidak membakar uang."

---

## 8. Kejujuran yang harus dijaga

Beberapa hal ini akan ditanyakan, dan menjawabnya jujur lebih menguntungkan daripada mengelak:

**"Apakah legal memakai banyak kunci gratis?"**
Bergantung ketentuan tiap penyedia. FreeAll AI tidak membuat kunci — pengguna mendaftarkan kunci mereka sendiri, dan Syarat & Ketentuan mewajibkan mereka berhak atas kunci itu. Jangan menjanjikan kebal aturan penyedia.

**"Apakah prompt saya aman?"**
Prompt diteruskan ke penyedia pihak ketiga dan tunduk pada kebijakan mereka. Isi percakapan **tidak** disimpan di database FreeAll AI, tapi jangan pernah menjanjikan kerahasiaan yang tidak bisa dijamin.

**"Kenapa bayar kalau saya bisa membuat sendiri?"**
Jawabannya bukan menakut-nakuti. Yang benar: "Logika fallback-nya memang bisa Anda tulis sendiri. Yang kami jual adalah tidak perlu menulisnya, tidak perlu mengurus server dan database, dan tidak perlu mengumpulkan kunci sendiri."

**"Kodenya terbuka?"**
Tidak. Katakan apa adanya, jangan mengaburkan. Kalau lawan bicara butuh memasang di infrastruktur sendiri, arahkan ke lisensi on-premise — itu jalur berbayar, bukan unduhan bebas.

---

## 9. Yang belum ada (jangan dijanjikan)

- **Pembayaran otomatis.** Peningkatan paket masih diaktifkan manual oleh admin.
- **SLA.** Ketersediaan bergantung penyedia pihak ketiga.
- **Fitur tim.** Paket Team saat ini soal kapasitas, belum ada anggota tim, SSO, atau log audit terpisah.
- **Streaming.** Endpoint membalas sekaligus, belum token-per-token.

---

## 10. Urutan yang disarankan berikutnya

1. **Pembayaran** — Midtrans untuk pasar Indonesia; tanpa ini langganan tidak bisa berjalan sendiri
2. **Endpoint OpenAI-compatible** (`/v1/chat/completions`) — supaya bisa dipakai langsung SDK OpenAI, LangChain, dan Cursor tanpa mengubah kode klien. Ini pemikat adopsi paling kuat.
3. **Streaming** — kebutuhan wajar untuk aplikasi chat
4. **Fitur tim sungguhan** — anggota, peran, dan log audit, supaya paket Team punya isi selain angka
