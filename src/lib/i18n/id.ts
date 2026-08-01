/**
 * Kamus Bahasa Indonesia — acuan bentuk untuk kamus bahasa lain.
 *
 * Sengaja TANPA `as const`: dengan `as const` setiap teks menjadi tipe
 * literalnya sendiri, sehingga terjemahan bahasa lain ditolak karena
 * "Sign in" bukan "Masuk". Yang ingin dijaga adalah bentuk kamusnya —
 * kunci yang hilang atau salah nama tetap terdeteksi TypeScript.
 */
export const id = {
  common: {
    dashboard: "Dashboard",
    login: "Masuk",
    register: "Daftar gratis",
    docs: "Dokumentasi",
    pricing: "Harga",
    howItWorks: "Cara kerja",
    api: "API",
    back: "Kembali",
    free: "gratis",
    language: "Bahasa",
  },

  home: {
    metaDescription:
      "API Gateway dengan sistem fallback cerdas. Satukan API key gratisan Anda dari Groq, Gemini, Claude, dan puluhan penyedia lain dalam satu endpoint.",
    badge: "Gratis untuk dipakai · Bisa di-self-host",
    titleLead: "Routing AI",
    titleAccent: "tanpa batas",
    subtitle:
      "Kumpulkan API key gratisan Anda dari berbagai penyedia AI di satu tempat. Saat satu kunci kena limit, permintaan otomatis diteruskan ke model dan kunci berikutnya — aplikasi Anda tidak perlu tahu apa-apa.",
    ctaPrimary: "Mulai gratis",
    ctaPrimaryLoggedIn: "Buka dashboard",
    ctaSecondary: "Lihat cara kerjanya",
    perks: [
      "Tanpa kartu kredit",
      "Kunci dienkripsi AES-256",
      "Fallback model dan kunci",
      "Bisa di-self-host penuh",
    ],
    demoUnavailableTitle: "Demo sedang tidak tersedia",
    demoUnavailableBody:
      "Admin belum menyediakan Provider Publik untuk dicoba pengunjung. Daftar dan tambahkan API key gratisan Anda sendiri untuk mulai memakai gateway.",

    statsKeys: "Kunci aktif di Provider Publik",
    statsRequests: "Request diproses hari ini",
    statsSuccess: "Berhasil dijawab",

    stepsEyebrow: "Cara kerja",
    stepsTitle: "Tiga langkah, tanpa konfigurasi rumit",
    stepLabel: "Langkah",
    steps: [
      {
        title: "Tempel API key",
        body: "Ambil kunci gratis dari Groq, Gemini, atau penyedia lain, lalu tempel apa adanya. Tidak perlu tahu Base URL maupun nama model.",
      },
      {
        title: "Sistem yang menata",
        body: "Penyedia dikenali dari bentuk kuncinya, model yang masih hidup ditanyakan langsung ke sumbernya, lalu diuji sekali sebelum disimpan.",
      },
      {
        title: "Panggil satu endpoint",
        body: "Aplikasi Anda cukup memanggil /api/v1/chat. Urusan limit, model mati, dan pergantian penyedia ditangani gateway.",
      },
    ],

    fallbackEyebrow: "Inti sistem",
    fallbackTitle: "Fallback berlapis, bukan sekadar coba ulang",
    fallbackSubtitle:
      "Penyedia gratis menghitung kuota per model, bukan per akun. Karena itu gateway turun bertahap: model dulu, baru kunci.",
    fallbackLayers: [
      {
        accent: "Lapis 1",
        title: "Model kena limit",
        body: "Kuota gratis dihitung per model. Saat model utama membalas 429, gateway langsung mencoba model lain pada kunci yang sama.",
      },
      {
        accent: "Lapis 2",
        title: "Kunci habis",
        body: "Kalau semua model di kunci itu ikut habis, giliran kunci berikutnya sesuai prioritas — bisa penyedia yang sama atau berbeda.",
      },
      {
        accent: "Lapis 3",
        title: "Kunci ditolak",
        body: "Kunci yang dibalas 401 atau 403 dinonaktifkan otomatis beserta alasannya, jadi tidak memperlambat request berikutnya.",
      },
    ],

    providersEyebrow: "Penyedia",
    providersTitle: (count: number) => `${count} penyedia siap pakai`,
    providersSubtitle: (free: number) =>
      `${free} di antaranya punya tier gratis. Penyedia lain yang kompatibel format OpenAI bisa ditambahkan sendiri.`,

    apiEyebrow: "API",
    apiTitle: "Satu endpoint, semua penyedia",
    apiSubtitle:
      "Generate API key di dashboard, lalu panggil endpoint yang sama dari aplikasi Anda. Gateway yang memilihkan penyedianya.",
    apiNote:
      "menandakan kunci pertama kena limit dan permintaan diteruskan otomatis — aplikasi Anda tetap menerima jawaban.",
    request: "Request",
    response: "Response",

    finalTitle: "Mulai dalam satu menit",
    finalBody:
      "Daftar, tempel satu API key gratisan, generate kunci FreeAll AI, dan aplikasi Anda sudah punya gateway AI dengan fallback otomatis.",
  },

  footer: {
    tagline:
      "Routing AI tanpa batas. Satukan API key dari berbagai penyedia di satu endpoint dengan fallback otomatis.",
    security:
      "Kunci provider dienkripsi AES-256-GCM. Kami tidak pernah menampilkannya kembali secara utuh, termasuk kepada Anda.",
    product: "Produk",
    account: "Akun",
    legal: "Ketentuan",
    playground: "Playground",
    terms: "Syarat & ketentuan",
    privacy: "Kebijakan privasi",
    security_link: "Keamanan data",
    selfHost: "Bisa di-self-host sepenuhnya.",
    disclaimer:
      "Prompt Anda diteruskan ke penyedia AI pihak ketiga dan tunduk pada kebijakan masing-masing. Jangan kirim data rahasia.",
  },

  auth: {
    loginTitle: "Masuk",
    loginSubtitle: "Masuk untuk membuka dashboard FreeAll AI.",
    registerTitle: "Buat akun",
    registerSubtitle: "Daftar untuk mengelola API key dan provider Anda.",
    name: "Nama",
    namePlaceholder: "Nama Anda (opsional)",
    email: "Email",
    password: "Kata sandi",
    passwordHint: "Minimal 8 karakter",
    noAccount: "Belum punya akun?",
    hasAccount: "Sudah punya akun?",
    tagline: "Routing AI tanpa batas — API Gateway dengan sistem fallback cerdas.",
  },

  demo: {
    title: "Coba langsung",
    noSignup: "tanpa perlu daftar",
    remaining: "sisa {n} percakapan",
    empty:
      "Tanyakan apa saja. Gateway akan memilih provider yang tersedia dan otomatis pindah kalau ada yang kena limit.",
    thinking: "Mencari provider yang tersedia…",
    placeholder: "Tulis pertanyaan Anda…",
    send: "Kirim",
    attempts: "percobaan",
    networkError: "Jaringan bermasalah. Coba lagi.",
    gatewayError: "Gagal menghubungi gateway.",
  },
};
