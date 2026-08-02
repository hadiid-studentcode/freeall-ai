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
    metaTitle: "FreeAll AI — Routing AI tanpa batas",
    metaTermsTitle: "Syarat & Ketentuan · FreeAll AI",
    metaTermsDesc:
      "Aturan pemakaian FreeAll AI: tanggung jawab atas API key, batas layanan, dan larangan penyalahgunaan.",
    metaPrivacyTitle: "Kebijakan Privasi · FreeAll AI",
    metaPrivacyDesc:
      "Data apa yang kami simpan, bagaimana API key Anda dilindungi, dan ke mana prompt Anda dikirim.",
    metaPricingTitle: "Harga · FreeAll AI",
    metaPricingDesc:
      "Pakai gratis dengan API key Anda sendiri, atau berlangganan untuk kuota Provider Publik yang lebih besar.",
    metaDocsTitle: "Dokumentasi · FreeAll AI",
    metaDocsDesc:
      "Cara kerja FreeAll AI: alur request, fallback berlapis, kepemilikan kunci, dan referensi API.",
    metaDescription:
      "API Gateway dengan sistem fallback cerdas. Satukan API key gratisan Anda dari Groq, Gemini, Claude, dan puluhan penyedia lain dalam satu endpoint.",
    badge: "Gratis untuk dipakai · Bawa kunci sendiri",
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
      "Siap dipakai dalam hitungan menit",
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
    onPremise: "Tersedia on-premise untuk kebutuhan enterprise.",
    disclaimer:
      "Prompt Anda diteruskan ke penyedia AI pihak ketiga dan tunduk pada kebijakan masing-masing. Jangan kirim data rahasia.",
  },

  /**
   * Pesan yang dikembalikan Server Action dan pustaka pendukungnya.
   *
   * Dipisah dari teks halaman karena dipakai di luar komponen — potongan yang
   * relevan dioper sebagai argumen ke `assertSafeExternalUrl`, `detectProvider`,
   * dan `verifyProviderKey` supaya pustaka itu tetap murni (tidak membaca
   * cookie sendiri) dan tetap bisa diuji terpisah.
   */
  errors: {
    /**
     * Endpoint demo dipanggil peramban, jadi pesannya ikut bahasa pengunjung.
     * `/api/v1/chat` sengaja tidak diterjemahkan: itu antarmuka mesin yang
     * dipanggil tanpa cookie, dan teks errornya bagian dari kontrak API.
     */
    demo: {
      globalQuota:
        "Kuota demo harian untuk seluruh pengunjung sudah habis. Daftar gratis untuk memakai gateway dengan kuota Anda sendiri.",
      hourlyLimit: (limit: number, minutes: number) =>
        `Kuota demo habis — ini batas dari gateway ini sendiri (bukan dari penyedia AI), ${limit} percakapan per jam per pengunjung, untuk menjaga kunci provider tidak terkuras. Coba lagi dalam ${minutes} menit, atau daftar gratis untuk mendapat API key dengan kuota harian sendiri.`,
      invalidJson: "Body request bukan JSON yang valid.",
      noProvider:
        "Belum ada penyedia AI yang dibagikan untuk demo. Admin perlu menambahkan kunci ke Provider Publik terlebih dahulu.",
      allFailed:
        "Semua penyedia yang tersedia sedang gagal atau kena limit. Coba lagi beberapa saat lagi.",
      internal: "Terjadi kesalahan internal.",
    },

    auth: {
      invalidEmail: "Alamat email tidak valid.",
      passwordTooShort: (min: number) =>
        `Kata sandi minimal ${min} karakter.`,
      emailTaken: "Email ini sudah terdaftar. Silakan masuk.",
      tooManyAttempts: (minutes: number) =>
        `Terlalu banyak percobaan masuk yang gagal. Coba lagi dalam ${minutes} menit.`,
      invalidCredentials: "Email atau kata sandi salah.",
    },

    billing: {
      invalidSelection: "Paket atau siklus penagihan tidak dikenali.",
      midtransUnavailable:
        "Pembayaran otomatis sedang tidak tersedia. Hubungi admin instance ini.",
      manualUnavailable: "Jalur transfer manual sedang ditutup admin.",
      midtransFailed: (detail: string) =>
        `Gagal membuat transaksi di Midtrans: ${detail}`,
      orderAlreadyOpen: (orderId: string) =>
        `Masih ada tagihan yang belum selesai (${orderId}). Selesaikan atau batalkan dulu sebelum membuat yang baru.`,
      manualCreated:
        "Tagihan dibuat. Lakukan transfer sesuai petunjuk, lalu tekan \u201cSaya sudah transfer\u201d.",
      proofTooShort:
        "Tulis keterangan transfer Anda — misalnya nama pengirim dan nomor referensi.",
      proofSubmitted:
        "Terima kasih. Tagihan Anda masuk antrean pemeriksaan admin.",
      orderNotFound: "Tagihan tidak ditemukan atau sudah tidak bisa diubah.",
    },
    apiKey: {
      invalidQuota: "Kuota harian harus bilangan bulat antara 1 dan 100.000.",
      planLimit: (plan: string, max: string) =>
        `Paket ${plan} dibatasi ${max} API key. Hapus yang tidak terpakai, atau tingkatkan paket untuk menambah kapasitas.`,
      created: "API key berhasil dibuat.",
    },

    provider: {
      disabledVerifyFailed: "Gagal uji koneksi saat ditambahkan",
      disabledManual: "Dinonaktifkan manual oleh pemilik",
      disabledRejected: (status: string) => `Ditolak provider (HTTP ${status})`,
      pickProvider: "Pilih penyedia AI terlebih dahulu.",
      keyEmpty: "API key provider tidak boleh kosong.",
      invalidPriority: "Prioritas harus bilangan bulat antara 0 dan 100.",
      noChatModels: (label: string) =>
        `Penyedia terdeteksi sebagai ${label}, tetapi tidak ada model chat yang tersedia untuk kunci ini. Pilih penyedia dan model manual.`,
      baseUrlRequired:
        "Base URL wajib diisi untuk penyedia yang tidak punya preset.",
      modelRequired: "Nama model wajib diisi untuk penyedia ini.",
      duplicate: "API key ini sudah terdaftar di sistem.",
      detectedNote: " (terdeteksi otomatis dari kunci)",
      savedDisabled: (label: string, message: string) =>
        `Kunci ${label} disimpan tetapi dinonaktifkan — uji koneksi gagal: ${message} Periksa kembali API key, Base URL, dan nama modelnya.`,
      savedTransient: (label: string, model: string, message: string) =>
        `Kunci ${label} ditambahkan dengan model ${model}, tetapi uji koneksi belum berhasil (${message}). Kunci tetap aktif karena penyebabnya kemungkinan sementara.`,
      savedOk: (label: string, model: string) =>
        `Kunci ${label} berhasil ditambahkan dan diuji dengan model ${model}.`,
      fallbackNote: (n: number) =>
        ` ${n} model cadangan disiapkan bila model ini kena limit.`,
    },

    url: {
      invalid: "Base URL tidak valid.",
      httpsRequired: "Base URL harus memakai HTTPS.",
      internalNetwork: "Base URL tidak boleh menunjuk ke jaringan internal.",
      internalAddress: "Base URL tidak boleh menunjuk ke alamat internal.",
      unresolvable: "Host pada Base URL tidak dapat diresolusi.",
      resolvesInternal: "Host pada Base URL mengarah ke alamat internal.",
    },

    discovery: {
      emptyKey: "API key kosong.",
      recognizedButRejected: (label: string) =>
        `Kunci ini dikenali sebagai ${label}, tetapi ditolak saat diuji. Periksa apakah kunci masih aktif.`,
      unknownProvider:
        "Tidak bisa mengenali penyedia dari kunci ini. Pilih penyedianya secara manual, atau gunakan opsi 'Lainnya' dan isi Base URL sendiri.",
    },

    verify: {
      invalidConfig: "Konfigurasi provider tidak valid.",
      unknownError: "Kesalahan tidak dikenal.",
    },
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

  plans: {
    FREE: {
      label: "Gratis",
      tagline: "Untuk mencoba dan proyek pribadi.",
      features: [
        "Bawa API key sendiri tanpa batas jumlah",
        "Fallback antar model dan kunci",
        "Deteksi penyedia otomatis",
        "Riwayat 7 hari terakhir",
      ],
    },
    PRO: {
      label: "Pro",
      tagline: "Untuk aplikasi yang sudah dipakai orang.",
      features: [
        "Semua yang ada di paket Gratis",
        "2.000 request/hari dari Provider Publik",
        "10 API key untuk memisahkan tiap aplikasi",
        "Riwayat 90 hari",
        "Batas lonjakan 3× lebih longgar",
      ],
    },
    TEAM: {
      label: "Team",
      tagline: "Untuk tim yang butuh kapasitas dan jejak audit.",
      features: [
        "Semua yang ada di paket Pro",
        "10.000 request/hari dari Provider Publik",
        "50 API key",
        "Riwayat 1 tahun untuk keperluan audit",
        "Dukungan prioritas",
      ],
    },
    ADMIN: {
      label: "Admin",
      tagline: "Akses penuh sebagai pengelola instance.",
      features: ["Tanpa batas paket", "Kelola Provider Publik", "Kelola pengguna"],
    },
  },

  pricing: {
    eyebrow: "Harga",
    title: "Bayar hanya kalau butuh kapasitas lebih",
    subtitle:
      "Dengan API key Anda sendiri, gateway ini gratis dipakai — tanpa batas dari kami. Berlangganan hanya kalau Anda ingin memakai kunci kami, riwayat yang lebih panjang, atau kapasitas yang lebih besar.",
    mostPicked: "Paling banyak dipilih",
    yourPlan: "Paket Anda",
    perMonth: "/ bulan",
    freeLabel: "Gratis",
    currentPlan: "Paket aktif",
    startFree: "Mulai gratis",
    choose: "Pilih",
    rowPublicQuota: "Kuota Provider Publik",
    rowApiKeys: "API key",
    rowHistory: "Riwayat",
    rowBurst: "Batas lonjakan",
    perDay: "/ hari",
    perMinute: "/ menit",
    days: "hari",
    manualNote:
      "Pembayaran otomatis belum tersambung. Untuk sementara, peningkatan paket diaktifkan manual oleh admin setelah konfirmasi — hubungi kami setelah mendaftar.",
    donateTitle: "Memakai versi gratis dan merasa terbantu?",
    donateBody:
      "Donasi membantu menutup biaya server dan kunci provider yang dipakai bersama, sehingga paket gratis tetap bisa berjalan untuk semua orang.",
    donateCta: "Beri dukungan",
    faqTitle: "Pertanyaan yang sering muncul",
    faq: [
      {
        q: "Kalau saya pakai API key sendiri, apakah tetap kena batas?",
        a: "Tidak. Batas kuota harian hanya berlaku saat Anda memakai Provider Publik — yaitu kunci milik kami. Begitu Anda menambahkan kunci sendiri, kuotanya milik Anda sepenuhnya dan kami tidak membatasinya.",
      },
      {
        q: "Bisa dipasang di server kami sendiri?",
        a: "Bisa, lewat lisensi on-premise untuk enterprise — hubungi kami untuk pembahasannya. Di luar itu, FreeAll AI adalah layanan terkelola: kuota dari kunci kami, riwayat yang disimpan lebih lama, dan Anda tidak perlu mengurus server maupun mengumpulkan kunci provider sendiri.",
      },
      {
        q: "Bisa berhenti kapan saja?",
        a: "Bisa. Langganan berlaku sampai tanggal berakhirnya, setelah itu akun kembali ke paket Gratis. Kunci provider dan API key Anda tidak dihapus.",
      },
      {
        q: "Fitur inti apakah dibatasi di paket gratis?",
        a: "Tidak. Fallback antar model dan kunci, deteksi penyedia otomatis, dan enkripsi kunci tersedia di semua paket — termasuk gratis. Yang membedakan hanya kapasitas.",
      },
    ],
  },

  docs: {
    diagrams: {
      flowLabel:
        "Alur request dari aplikasi Anda melewati gateway menuju penyedia AI",
      flowApp: "Aplikasi Anda",
      flowAppSub: "kirim prompt",
      flowAuth: "Autentikasi",
      flowAuthSub: "cek API key",
      flowLimit: "Rate limit",
      flowLimitSub: "kuota harian",
      flowManagerSub: "pilih kunci & model",
      flowProvider: "Penyedia AI",
      flowAnswer: "jawaban",
      flowLogSub: "riwayat & kuota",

      fallbackLabel:
        "Fallback berlapis: mencoba model lain pada kunci yang sama sebelum pindah kunci",
      fallbackKey1: "Kunci #1 — prioritas tertinggi",
      fallbackKey2: "Kunci #2 — prioritas berikutnya",
      fallbackPrimary: "Model utama",
      fallbackBackup: "Model cadangan",
      fallbackQuotaGone: "429 kuota habis",
      fallbackSwitchKey: "pindah kunci",
      fallbackSuccess: "200 berhasil",
      fallbackDelivered: "Jawaban dikirim ke aplikasi",

      scopeLabel:
        "Kunci pribadi hanya dipakai pemiliknya; Provider Publik dipakai semua orang",
      scopeUserA: "User A",
      scopeUserASub: "punya kunci sendiri",
      scopeVisitor: "Pengunjung",
      scopeVisitorSub: "demo, tanpa akun",
      scopeTriedFirst: "dicoba lebih dulu",
      scopePrivateKey: "Kunci pribadi A",
      scopePrivateKeySub: "hanya untuk User A",
      scopeWhenExhausted: "kalau habis",
      scopeOnlyThis: "hanya ini",
      scopePublic: "Provider Publik",
      scopePublicSub: "dikelola admin · dipakai bersama",
      scopeNote1: "Kunci pribadi milik user lain tidak pernah tersentuh",
      scopeNote2: "oleh pengunjung demo maupun user lain.",
    },

    eyebrow: "Dokumentasi",
    title: "Cara kerja FreeAll AI",
    intro:
      "FreeAll AI berdiri di antara aplikasi Anda dan puluhan penyedia AI. Aplikasi memanggil satu endpoint; gateway yang mengurus kunci mana yang dipakai, model mana yang masih punya kuota, dan apa yang dilakukan saat sebuah kunci kehabisan jatah.",
    sections: {
      flow: "Alur request",
      fallback: "Fallback berlapis",
      ownership: "Kepemilikan kunci",
      quota: "Kuota & batas",
      api: "Referensi API",
    },
    stepLabel: "Langkah",
    flowTitle: "Alur satu request",
    flowSubtitle:
      "Setiap panggilan melewati empat tahap sebelum menyentuh penyedia AI. Kalau salah satu tahap menolak, request berhenti di situ dan aplikasi Anda menerima alasannya.",
    flowSteps: [
      {
        t: "Autentikasi",
        d: "Header Authorization dicocokkan dengan API key Anda. Yang disimpan di database hanya hash-nya, jadi kunci asli tidak bisa dibaca ulang siapa pun.",
      },
      {
        t: "Rate limit",
        d: "Kuota harian per API key dan batas lonjakan per menit diperiksa. Kalau habis, balasannya 429 beserta perkiraan waktu pulih.",
      },
      {
        t: "AiManager",
        d: "Inti sistem. Menyusun daftar kunci yang boleh dipakai, lalu mencobanya satu per satu bersama model cadangannya.",
      },
      {
        t: "Pencatatan",
        d: "Hasilnya — berhasil atau gagal, berapa percobaan, berapa milidetik — ditulis ke RequestLog untuk riwayat dan perhitungan kuota.",
      },
    ],
    fallbackTitle: "Fallback berlapis",
    fallbackSubtitlePre:
      "Ini bagian yang membedakan FreeAll AI dari sekadar coba-ulang. Penyedia gratis menghitung kuota",
    fallbackSubtitleBold: "per model",
    fallbackSubtitlePost:
      ", bukan per akun — jadi model yang kehabisan jatah belum tentu berarti kuncinya habis.",
    failureTableTitle: "Apa yang terjadi pada tiap jenis kegagalan",
    colProviderReply: "Balasan penyedia",
    colMeaning: "Artinya",
    colAction: "Tindakan gateway",
    failures: [
      { code: "429", meaning: "Kuota model habis", action: "Coba model berikutnya pada kunci yang sama" },
      { code: "404", meaning: "Model sudah dipensiunkan", action: "Coba model berikutnya pada kunci yang sama" },
      { code: "401 / 403", meaning: "Kunci ditolak permanen", action: "Kunci dinonaktifkan otomatis, lanjut ke kunci berikutnya" },
      { code: "5xx", meaning: "Gangguan sementara", action: "Dicatat, lanjut ke percobaan berikutnya" },
    ],
    selfHealTitle: "Menyembuhkan diri",
    selfHealBody:
      "Kalau model cadangan yang akhirnya berhasil, model itu dinaikkan menjadi model utama. Request berikutnya langsung memakai yang terbukti jalan, tidak lagi membuang satu percobaan ke model yang sedang habis.",
    ownershipTitle: "Kunci siapa dipakai siapa",
    ownershipSubtitle:
      "Kunci yang Anda daftarkan bersifat pribadi. Pengguna lain dan pengunjung demo tidak pernah menyentuhnya — kuota yang Anda bayar atau Anda kumpulkan tetap milik Anda.",
    privateKeyTitle: "Kunci pribadi",
    privateKeyBody:
      "Bawaan setiap kunci yang Anda tambahkan. Hanya dipakai akun Anda, dan selalu dicoba lebih dulu sebelum yang lain.",
    publicKeyTitle: "Provider Publik",
    publicKeyBody:
      "Kunci yang sengaja dibagikan admin. Menjadi cadangan bagi semua pengguna sekaligus tenaga untuk demo di halaman depan yang bisa dicoba tanpa mendaftar.",
    quotaTitle: "Kuota dan batas",
    quotaSubtitle:
      "Ada tiga lapis pembatas dengan tujuan berbeda. Semuanya berjalan sebelum request menyentuh penyedia AI.",
    colLimit: "Batas",
    colWhoSets: "Siapa yang mengatur",
    colAppliesTo: "Berlaku untuk",
    quotaRows: [
      { limit: "Kuota harian API key", who: "Anda sendiri", applies: "Tiap API key, agar satu aplikasi tidak menghabiskan semuanya" },
      { limit: "Kuota Provider Publik", who: "Admin", applies: "Pengguna yang belum membawa kunci sendiri. Lepas begitu Anda menambahkan kunci pribadi" },
      { limit: "Batas lonjakan", who: "Sistem", applies: "Mengikuti paket langganan, per API key" },
    ],
    apiTitle: "Referensi API",
    apiSubtitlePre: "Satu endpoint untuk semua penyedia. Uji langsung tanpa menulis kode lewat",
    apiSubtitlePost: ".",
    bodyFormsPre: "Selain",
    bodyFormsMid: ", endpoint menerima percakapan multi-giliran lewat",
    bodyFormsOpts: ", serta opsi",
    bodyFormsPost: "untuk memaksa satu penyedia.",
    bodyFormsTitle: "Bentuk body lain",
    statusTitle: "Kode status",
    colCode: "Kode",
    colMeaningShort: "Arti",
    providersTitle: (n: number) => `${n} penyedia dikenali otomatis`,
    providersBody:
      "Tempel API key apa adanya — penyedianya dikenali dari bentuk kunci, dan model yang masih aktif ditanyakan langsung ke sumbernya.",
    ctaTitle: "Siap mencoba?",
    ctaBody:
      "Daftar, tempel satu API key gratisan, lalu panggil endpoint yang sama dari aplikasi Anda.",
    statusCodes: [
      { code: "200", meaning: "Berhasil. Cek `attempts` untuk tahu berapa percobaan yang dilalui." },
      { code: "400", meaning: "Body tidak valid — `prompt` atau `messages` tidak ada, atau formatnya salah." },
      { code: "401", meaning: "API key hilang, salah, atau sudah dinonaktifkan." },
      { code: "429", meaning: "Kuota harian atau batas lonjakan terlampaui. Lihat header `Retry-After`." },
      { code: "503", meaning: "Tidak ada kunci provider yang bisa dipakai, atau semuanya gagal." },
    ],
  },

  terms: {
    eyebrow: "Syarat & Ketentuan",
    title: "Aturan pemakaian",
    intro: "Dengan memakai FreeAll AI, Anda menyetujui hal-hal berikut.",
    notice:
      "FreeAll AI adalah perantara. Kami tidak menjalankan model AI sendiri — setiap permintaan diteruskan ke penyedia pihak ketiga memakai API key yang Anda atau admin daftarkan, dan tunduk pada ketentuan mereka.",
    sections: [
      {
        title: "1. API key yang Anda daftarkan",
        body: [
          "Anda menyatakan berhak memakai setiap API key yang Anda daftarkan, dan bahwa pemakaiannya lewat FreeAll AI tidak melanggar ketentuan penyedia asalnya. Anda bertanggung jawab penuh atas biaya, kuota, dan konsekuensi pemakaian kunci tersebut.",
          "Kunci yang ditandai publik akan dipakai pengguna lain dan pengunjung demo. Tandai sebagai publik hanya kalau Anda memang bersedia kuotanya dipakai bersama.",
        ],
      },
      {
        title: "2. Batas layanan dan kuota",
        body: [
          "Kuota harian, batas lonjakan, dan jumlah API key mengikuti paket yang aktif. Batas ini bisa kami sesuaikan sewaktu-waktu — terutama pada paket gratis — untuk menjaga layanan tetap berjalan bagi semua pengguna.",
          "Ketersediaan bergantung pada penyedia pihak ketiga. Kami tidak menjanjikan tingkat ketersediaan (SLA) tertentu pada paket gratis.",
        ],
      },
      {
        title: "3. Yang dilarang",
        body: [
          "Mendaftarkan API key yang bukan milik Anda atau yang diperoleh tanpa izin. Berusaha mengakses kunci, data, atau akun pengguna lain. Memakai layanan untuk aktivitas melanggar hukum, atau yang dilarang oleh ketentuan penyedia AI yang bersangkutan. Membuat banyak akun untuk menghindari batas kuota. Membebani layanan secara otomatis di luar batas yang wajar.",
          "Pelanggaran dapat berakibat penonaktifan API key atau penghapusan akun tanpa pemberitahuan sebelumnya.",
        ],
      },
      {
        title: "4. Isi percakapan",
        body: [
          "Anda bertanggung jawab atas prompt yang dikirim dan jawaban yang Anda gunakan. Jawaban model AI bisa keliru, bias, atau mengada-ada — jangan dijadikan satu-satunya dasar keputusan penting, terutama di bidang medis, hukum, atau keuangan.",
        ],
      },
      {
        title: "5. Langganan dan pembayaran",
        body: [
          "Paket berbayar berlaku sampai tanggal berakhirnya, lalu akun kembali ke paket gratis. Kunci provider dan API key Anda tidak dihapus saat langganan berakhir. Pembayaran yang sudah masuk tidak dikembalikan, kecuali layanan memang tidak dapat kami sediakan.",
        ],
      },
      {
        title: "6. Batas tanggung jawab",
        body: [
          "Layanan disediakan apa adanya. Kami tidak bertanggung jawab atas kerugian yang timbul dari kuota yang habis, kunci yang dinonaktifkan penyedia, gangguan pihak ketiga, atau keputusan yang diambil berdasarkan jawaban model AI.",
        ],
      },
      {
        title: "7. Pemasangan on-premise",
        body: [
          "Ketentuan ini berlaku untuk instance yang kami operasikan. Pemasangan di infrastruktur Anda sendiri hanya tersedia lewat lisensi on-premise tertulis; syaratnya diatur dalam perjanjian terpisah, dan tanggung jawab operasional, keamanan, serta kepatuhannya ada pada Anda.",
        ],
      },
      {
        title: "8. Perubahan",
        body: [
          "Ketentuan ini dapat berubah. Perubahan berarti berlaku sejak diumumkan di halaman ini. Dengan terus memakai layanan setelah perubahan, Anda dianggap menyetujuinya.",
        ],
      },
    ],
  },

  privacy: {
    eyebrow: "Kebijakan Privasi",
    title: "Data Anda, dan apa yang kami lakukan dengannya",
    intro:
      "Ditulis sesingkat mungkin dan tanpa bahasa berbelit, karena Anda menitipkan sesuatu yang sensitif: API key milik Anda sendiri.",
    warningBold: "Jangan kirim data rahasia lewat prompt.",
    warningBody:
      "Isi percakapan Anda diteruskan ke penyedia AI pihak ketiga (Groq, Google, Anthropic, dan lainnya) dan tunduk pada kebijakan penyimpanan mereka masing-masing, di luar kendali kami.",
    storageTitle: "Bagaimana API key provider disimpan",
    encryptedTitle: "Dienkripsi, bukan disandi",
    encryptedBody:
      "Kunci provider dienkripsi dengan AES-256-GCM sebelum masuk database. Yang tersimpan di kolom unik hanya SHA-256-nya, dipakai untuk mencegah kunci yang sama didaftarkan dua kali.",
    unreadableTitle: "Tidak bisa dibaca ulang",
    unreadableBody:
      "Kunci API FreeAll AI hanya disimpan sebagai hash. Kami tidak bisa menampilkannya lagi — bahkan kepada Anda. Kalau hilang, kunci lama dihapus dan dibuat yang baru.",
    previewNote: "Di dashboard, kunci hanya ditampilkan sebagai potongan seperti",
    previewNotePost: "— cukup untuk mengenalinya, tidak cukup untuk dipakai.",
    storedTitle: "Data yang kami simpan",
    stored: [
      { label: "Akun", body: "Email, nama (opsional), dan kata sandi yang di-hash dengan scrypt. Kata sandi asli tidak pernah disimpan." },
      { label: "Kunci provider", body: "Terenkripsi, beserta penyedia, model, dan statistik pemakaian." },
      { label: "Riwayat request", body: "Waktu, penyedia, model, berhasil atau tidak, jumlah percobaan, dan lama respons. Isi prompt dan jawaban tidak disimpan." },
      { label: "Sesi login", body: "Token sesi disimpan sebagai hash; cookie di peramban Anda yang membawa nilai aslinya." },
    ],
    notDoTitle: "Yang tidak kami lakukan",
    notDo: [
      "Tidak menjual atau membagikan data Anda ke pihak ketiga.",
      "Tidak memakai prompt Anda untuk melatih model apa pun.",
      "Tidak memakai kunci pribadi Anda untuk melayani permintaan pengguna lain. Kunci hanya dipakai bersama kalau Anda — atau admin, untuk kuncinya sendiri — menandainya sebagai publik.",
    ],
    thirdPartyTitle: "Pihak ketiga",
    thirdPartyBody:
      "Setiap prompt diteruskan ke penyedia AI yang kuncinya dipakai. Mereka punya kebijakan privasi dan masa simpan sendiri. Kami tidak mengendalikan apa yang mereka lakukan dengan data itu, jadi perlakukan setiap prompt seolah akan dibaca pihak lain.",
    deleteTitle: "Menghapus data",
    deleteBody:
      "Anda bisa menghapus kunci provider dan API key kapan saja lewat dashboard; penghapusan berlaku langsung. Untuk menghapus seluruh akun beserta datanya, hubungi admin instance ini.",
    onPremiseTitle: "Pemasangan on-premise",
    onPremiseBody:
      "Untuk pelanggan dengan lisensi on-premise, seluruh data berada di infrastruktur Anda sendiri dan kebijakan ini tidak berlaku — Andalah pengendali datanya. Simpan ENCRYPTION_KEY baik-baik: tanpa itu, kunci yang sudah tersimpan tidak bisa didekripsi lagi.",
  },

  dash: {
    nav: {
      overview: "Ringkasan",
      providers: "Provider AI",
      apiKeys: "API Key",
      playground: "Playground",
      logs: "Riwayat",
      plan: "Paket",
      admin: "Admin",
    },
    logout: "Keluar",

    apiKeys: {
      title: "API Key",
      subtitlePre: "Kunci otorisasi untuk memakai gateway FreeAll AI dari aplikasi Anda sendiri.",
      subtitleBold: "Kuota harian",
      subtitlePost:
        "adalah rem pemakaian: begitu jumlah request hari ini menyentuh angka itu, endpoint membalas 429 sampai tengah malam — berguna agar satu aplikasi tidak menghabiskan seluruh kunci provider. Bisa diubah kapan saja.",
      createTitle: "Buat API key baru",
      createHintPre: "Kunci ini dipakai aplikasi Anda untuk memanggil",
      name: "Nama",
      namePlaceholder: "mis. Aplikasi Produksi",
      dailyQuota: "Kuota harian",
      create: "Buat kunci",
      copyNowTitle: "Salin sekarang — kunci ini tidak akan ditampilkan lagi.",
      copyNowBody:
        "Database hanya menyimpan hash-nya, jadi kami sendiri tidak bisa memulihkannya. Kalau hilang, buat kunci baru.",
      copy: "Salin",
      yourKeys: "Kunci Anda",
      noKeys: "Belum ada kunci.",
      registered: (n: number) => `${n} kunci terdaftar.`,
      empty: "Buat kunci pertama Anda lewat formulir di atas.",
      colName: "Nama",
      colKey: "Kunci",
      colStatus: "Status",
      colUsage: "Pemakaian hari ini",
      colLastUsed: "Terakhir dipakai",
      colCreated: "Dibuat",
      colActions: "Aksi",
      save: "Simpan",
      active: "Aktif",
      inactive: "Nonaktif",
      disable: "Nonaktifkan",
      enable: "Aktifkan",
      remove: "Hapus kunci",
    },

    providers: {
      title: "Provider AI",
      subtitle:
        "Kunci yang Anda daftarkan masuk ke kolam fallback. Saat satu kunci kena limit (429), gateway otomatis meneruskan permintaan ke kunci berikutnya sesuai prioritas.",
      registered: "Kunci terdaftar",
      noKeys: "Belum ada kunci.",
      count: (n: number) => `${n} kunci, diurutkan sesuai urutan eksekusi.`,
      empty: "Tambahkan kunci pertama Anda lewat formulir di atas.",
      colProvider: "Penyedia",
      colModel: "Model",
      colStatus: "Status",
      colPriority: "Prioritas",
      colSuccess: "Sukses / Gagal",
      colLastUsed: "Terakhir dipakai",
      colActions: "Aksi",
      fallbackModels: (n: number) => `+${n} model cadangan`,
      public: "Publik",
      private: "Pribadi",
      publicTitle: "Publik — dipakai semua pengguna dan demo halaman depan",
      privateTitle: "Hanya dipakai akun Anda",
      makePrivate: "Jadikan pribadi",
      makePublic: "Jadikan publik",
      save: "Simpan",
      active: "Aktif",
      inactive: "Nonaktif",
      disable: "Nonaktifkan",
      enable: "Aktifkan kembali",
      refresh: "Segarkan daftar model dari penyedia",
      remove: "Hapus kunci",
    },

    providerForm: {
      title: "Tambah kunci provider",
      description:
        "Tempel API key Anda — sistem mengenali penyedianya sendiri, mencari model yang masih aktif, lalu mengujinya. Kunci dienkripsi AES-256-GCM sebelum disimpan dan tidak pernah ditampilkan ulang secara utuh.",
      apiKey: "API key",
      apiKeyPlaceholder: "Tempel API key dari penyedia mana pun",
      autoHint:
        "Mendukung Groq, Gemini, Claude, OpenRouter, Cerebras, NVIDIA, xAI, DeepSeek, Mistral, dan lainnya.",
      getKeyAt: "Ambil kunci di",
      provider: "Penyedia",
      autoOption: "✨ Deteksi otomatis (disarankan)",
      freeTier: " — ada tier gratis",
      priority: "Prioritas",
      priorityHint: "Makin tinggi, makin awal dicoba (0–100).",
      baseUrl: "Base URL",
      optional: "(opsional)",
      baseUrlPlaceholder: "https://api.contoh.com/v1",
      model: "Model (opsional)",
      modelPlaceholder: "dipilih otomatis bila dikosongkan",
      modelHint: "Kosongkan agar sistem memilih model aktif dari penyedia.",
      shareTitle: "Bagikan ke Provider Publik",
      shareBody:
        "Kunci dipakai semua pengguna terdaftar dan demo halaman depan. Kalau tidak dicentang, kunci ini hanya untuk akun Anda sendiri.",
      autoBadge: "Base URL & model ditentukan otomatis",
      submit: "Tambahkan kunci",
      submitting: "Mendeteksi & menguji…",
    },

    admin: {
      demoTitle: "Batas demo halaman depan",
      demoDesc:
        "Pengunjung bisa mencoba chat tanpa membuat akun. Batas-batas ini yang menjaga kunci provider Anda tidak terkuras orang lewat halaman depan. Isi 0 untuk mematikan sebuah batas.",
      demoPerHour: "Per pengunjung, per jam",
      demoPerDay: "Per pengunjung, per hari",
      demoGlobal: "Seluruh pengunjung, per hari",
      demoGlobalHint:
        "Pagar terakhir: batas per pengunjung tidak menolong kalau yang datang seribu orang berbeda. Isi 0 untuk mematikan demo sepenuhnya.",
      demoNote: "Berlaku sejak percakapan berikutnya.",
      paymentTitle: "Pembayaran",
      paymentDesc:
        "Tentukan jalur yang boleh dipakai pengguna untuk naik paket. Jalur Midtrans hanya benar-benar terbuka bila kredensialnya sudah terpasang.",
      modeLabel: "Jalur pembayaran",
      modeOFF: "Tutup semua — tidak ada yang bisa naik paket sendiri",
      modeMANUAL: "Transfer manual saja — admin yang mengonfirmasi",
      modeMIDTRANS: "Midtrans saja — otomatis",
      modeBOTH: "Keduanya — pembeli yang memilih",
      modeNotReady:
        "Mode ini memerlukan kredensial Midtrans, yang belum terpasang. Selama itu belum ada, jalur Midtrans tetap tertutup bagi pengguna.",
      instructionsLabel: "Petunjuk transfer manual",
      instructionsPlaceholder:
        "Contoh:\nBCA 1234567890 a.n. Nama Anda\nCantumkan nomor pesanan pada berita transfer.",
      instructionsHint:
        "Ditampilkan ke pembeli saat mereka memilih transfer manual.",
      midtransTitle: "Kredensial Midtrans",
      midtransFromEnv:
        "Terbaca dari environment variable. Nilai di sini tidak dipakai selama env terisi — ubah lewat konfigurasi deploy.",
      midtransFromDb: "Diatur lewat dashboard ini, tersimpan terenkripsi.",
      midtransMissing: "Belum terpasang.",
      serverKey: "Server key",
      clientKey: "Client key",
      production: "Mode produksi (bukan sandbox)",
      saveCredentials: "Simpan kredensial",
      clearCredentials: "Hapus kredensial",
      webhookTitle: "URL notifikasi",
      webhookHint:
        "Daftarkan alamat ini di dashboard Midtrans → Settings → Configuration → Payment Notification URL. Tanpa itu, paket tidak akan pernah aktif otomatis.",
      sandboxBadge: "Sandbox",
      productionBadge: "Produksi",

      queueTitle: "Konfirmasi transfer manual",
      queueDesc:
        "Tagihan yang pembelinya mengaku sudah transfer. Setujui hanya setelah uangnya terlihat di mutasi rekening.",
      queueEmpty: "Tidak ada yang menunggu konfirmasi.",
      queueColUser: "Pembeli",
      queueColOrder: "Pesanan",
      queueColPlan: "Paket",
      queueColAmount: "Jumlah",
      queueColNote: "Keterangan pembeli",
      queueColCreated: "Dibuat",
      approve: "Setujui",
      reject: "Tolak",
      adminNotePlaceholder: "Catatan (opsional)",
      title: "Admin",
      subtitle:
        "Kelola Provider Publik dan pengguna. Kunci di Provider Publik dipakai semua akun terdaftar sekaligus menjadi tenaga untuk demo halaman depan yang bisa dicoba pengunjung tanpa mendaftar.",
      statUsers: "Pengguna",
      statUsersHint: (n: number) => `${n} admin`,
      statPublicKeys: "Kunci publik",
      statPublicKeysHint: (total: string) => `dari ${total} kunci total`,
      statRequests: "Request hari ini",
      statRequestsHint: (n: string) => `${n} dari demo`,
      statSuccess: "Tingkat sukses",
      statSuccessNone: "belum ada request",
      emptyPoolPre:
        "Belum ada kunci di Provider Publik, jadi demo halaman depan dan pengguna yang belum membawa kunci sendiri akan menerima 503. Tambahkan kunci di",
      emptyPoolCta: "Provider AI",
      emptyPoolPost: "dan centang \u201cBagikan ke Provider Publik\u201d.",
      quotaTitle: "Kuota pengguna tanpa kunci sendiri",
      quotaDescPre:
        "Pagar harian untuk pengguna yang mengandalkan Provider Publik. Begitu mereka menambahkan kunci provider sendiri, pagar ini lepas. Isi",
      quotaDescPost: "untuk menutup pemakaian Provider Publik sepenuhnya.",
      quotaField: "Request per hari",
      save: "Simpan",
      quotaNote: "Berlaku sejak request berikutnya.",
      poolTitle: "Provider Publik",
      poolDesc: "Kunci yang dipakai semua pengguna dan demo halaman depan.",
      poolEmpty: "Belum ada kunci yang dibagikan.",
      colProvider: "Penyedia",
      colModel: "Model",
      colOwner: "Pemilik",
      colStatus: "Status",
      colSuccess: "Sukses / Gagal",
      colLastUsed: "Terakhir dipakai",
      colActions: "Aksi",
      system: "sistem",
      active: "Aktif",
      inactive: "Nonaktif",
      makePrivate: "Jadikan pribadi",
      catalogTitle: "Katalog penyedia",
      catalogDesc:
        "Tambahkan penyedia AI baru tanpa deploy ulang. Yang tersimpan di sini langsung muncul di halaman depan, dokumentasi, dan formulir pendaftaran kunci. Penyedia bawaan tidak perlu didaftarkan lagi.",
      catalogSlug: "Slug — mis. novita",
      catalogLabel: "Nama tampilan — Novita AI",
      catalogFormat: "Format API",
      catalogFormatOpenai: "Format OpenAI",
      catalogFormatGemini: "Format Gemini",
      catalogFormatAnthropic: "Format Anthropic",
      catalogModel: "Model bawaan",
      catalogConsole: "URL halaman API key (opsional)",
      catalogFree: "Punya tier gratis",
      catalogSubmit: "Tambahkan penyedia",
      catalogFreeBadge: "gratis",
      remove: "Hapus",
      usersTitle: "Pengguna",
      usersDesc: (n: number) =>
        `${n} akun terdaftar. Admin bisa membagikan kunci ke Provider Publik; pengguna biasa memakai kunci sendiri ditambah Provider Publik.`,
      colEmail: "Email",
      colName: "Nama",
      colRole: "Peran",
      colPlan: "Paket",
      colProviderKeys: "Kunci provider",
      colApiKeys: "API key",
      colJoined: "Bergabung",
      you: "(Anda)",
      planAria: (email: string) => `Paket ${email}`,
      durationAria: "Masa berlaku (hari)",
      durationTitle: "Masa berlaku dalam hari; 0 = tanpa batas",
      set: "Set",
      until: "s/d",
      makeUser: "Jadikan user",
      makeAdmin: "Jadikan admin",
      removeUser: "Hapus pengguna beserta seluruh kuncinya",
    },

    billing: {
      title: "Tingkatkan paket",
      subtitle:
        "Pilih paket dan siklus penagihan. Masa berlaku yang tersisa tidak hangus — ditambahkan ke periode baru.",
      closed:
        "Admin instance ini belum membuka jalur pembayaran. Hubungi admin untuk naik paket.",
      cycleMonthly: "Bulanan",
      cycleYearly: "Tahunan",
      yearlyBadge: "Hemat 2 bulan",
      perMonth: "/ bulan",
      perYear: "/ tahun",
      savings: (amount: string) => `Hemat ${amount} dibanding bayar bulanan`,
      payMidtrans: "Bayar dengan Midtrans",
      payManual: "Transfer manual",
      processing: "Memproses…",
      sandboxNotice:
        "Midtrans masih dalam mode sandbox — pembayaran tidak menarik uang sungguhan.",

      openTitle: "Tagihan berjalan",
      orderId: "Nomor pesanan",
      amount: "Jumlah",
      created: "Dibuat",
      due: "Batas waktu",
      continuePayment: "Lanjutkan pembayaran",
      cancelOrder: "Batalkan",
      manualHowTo: "Cara membayar",
      noInstructions:
        "Admin belum menuliskan petunjuk transfer. Hubungi admin untuk detail rekening.",
      proofLabel: "Keterangan transfer",
      proofPlaceholder: "mis. Transfer BCA a.n. Budi, ref 1234567",
      proofSubmit: "Saya sudah transfer",
      awaitingReview:
        "Menunggu pemeriksaan admin. Paket aktif setelah transfer Anda dicocokkan.",

      historyTitle: "Riwayat pembayaran",
      historyEmpty: "Belum ada transaksi.",
      colDate: "Tanggal",
      colPlan: "Paket",
      colAmount: "Jumlah",
      colMethod: "Metode",
      colStatus: "Status",
      methodMidtrans: "Midtrans",
      methodManual: "Transfer manual",
      statusPENDING: "Menunggu pembayaran",
      statusAWAITING_REVIEW: "Menunggu pemeriksaan",
      statusPAID: "Lunas",
      statusFAILED: "Gagal",
      statusEXPIRED: "Kedaluwarsa",
      statusCANCELLED: "Dibatalkan",
      returnedPaid: "Pembayaran diterima — paket Anda sudah aktif.",
      returnedPending:
        "Pembayaran belum terkonfirmasi. Kalau Anda sudah membayar, status akan berubah sendiri dalam beberapa menit.",
    },

    logs: {
      title: "Riwayat request",
      subtitlePre: "Kolom",
      subtitleBold: "Percobaan",
      subtitleMid:
        "menunjukkan berapa kombinasi kunci dan model yang dilalui sebelum request selesai — angka di atas 1 berarti fallback bekerja.",
      subtitleAdmin: "Sebagai admin, percakapan lewat demo halaman depan ikut tampil dengan tanda Demo.",
      subtitleUser: "Hanya request lewat API key Anda yang tampil di sini.",
      retention: (plan: string, days: string) =>
        `Paket ${plan} menampilkan riwayat ${days} hari terakhir.`,
      lastN: (n: number) => `${n} request terakhir`,
      none: "Belum ada request yang tercatat.",
      showing: (n: number) => `Menampilkan ${n} entri terbaru.`,
      emptyPre: "Kirim request pertama ke",
      emptyPost: "untuk melihat riwayatnya di sini.",
      colTime: "Waktu",
      colStatus: "Status",
      colProvider: "Provider",
      colModel: "Model",
      colAttempts: "Percobaan",
      colLatency: "Latensi",
      colSource: "Sumber",
      success: "Sukses",
      failed: "Gagal",
      demo: "Demo",
    },

    playground: {
      title: "Playground",
      subtitle:
        "Uji endpoint gateway langsung dari sini — lengkap dengan header Authorization, kode status, dan waktu respons yang sebenarnya.",
      noKeyPre: "Anda belum punya API key aktif.",
      noKeyCta: "Buat satu di halaman API Key",
      noKeyPost: "lalu tempel di sini.",
      requestTitle: "Request",
      requestHintPre: "Memanggil",
      requestHintPost: "persis seperti aplikasi luar Anda.",
      apiKeyLabel: "API key FreeAll AI",
      apiKeyHint: "Kunci tidak disimpan — hanya dipakai untuk request ini di peramban Anda.",
      promptLabel: "Prompt",
      promptDefault: "Halo! Perkenalkan dirimu singkat saja.",
      forceProvider: "Paksa penyedia (opsional)",
      auto: "Otomatis — sesuai prioritas",
      forceHint: "Berguna untuk menguji satu penyedia tertentu tanpa mematikan yang lain.",
      send: "Kirim request",
      sending: "Mengirim…",
      needKey: "Masukkan API key FreeAll AI Anda terlebih dahulu.",
      sendFailed: "Permintaan gagal dikirim.",
      responseTitle: "Response",
      doneIn: "Selesai dalam {n} ms",
      notSent: "Belum ada request dikirim.",
      placeholder: "Isi API key dan prompt, lalu tekan Kirim request.",
      curlTitle: "Setara cURL",
      curlHint: "Salin untuk dipakai di terminal atau aplikasi Anda.",
    },
    plan: {
      adminLabel: "Admin",
      adminTagline: "Akses penuh sebagai pengelola instance.",
      title: "Paket & Kuota",
      subtitle:
        "Batas yang berlaku untuk akun Anda dan seberapa banyak yang sudah terpakai hari ini.",
      compare: "Bandingkan paket",
      expiring: (n: number, date: string) =>
        `Paket Anda berakhir dalam ${n} hari (${date}). Setelah itu akun kembali ke paket Gratis — kunci provider dan API key Anda tidak dihapus.`,
      planPrefix: "Paket",
      activeBadge: "Aktif",
      perMonth: "/ bulan",
      meterApiKeys: "API key",
      meterApiKeysHint: (used: string, max: string) => `${used} dari ${max} terpakai`,
      meterPublic: "Kuota Provider Publik hari ini",
      meterPublicNa: "Tidak berlaku — Anda memakai kunci sendiri",
      factHistory: "Riwayat tersimpan",
      factBurst: "Batas lonjakan",
      days: "hari",
      perMinute: "request / menit",
      usingPoolPre: "Anda memakai",
      usingPoolBold: "Provider Publik",
      usingPoolMid: "— kunci milik operator, yang dibagi dengan pengguna lain.",
      usingPoolCta: "Tambahkan kunci provider sendiri",
      usingPoolPost: "dan batas harian ini lepas sepenuhnya, berapa pun paket Anda.",
      ownKeysPre: (n: number) => `Anda memakai kunci provider sendiri (${n} kunci aktif), jadi`,
      ownKeysBold: "tidak ada batas kuota harian",
      ownKeysPost: "dari kami. Yang berlaku hanya kuota dari penyedia AI masing-masing.",
      availableTitle: "Paket yang tersedia",
      yourPlan: "Paket Anda",
      rowPublic: "Provider Publik",
      rowApiKeys: "API key",
      rowHistory: "Riwayat",
      rowBurst: "Lonjakan",
      perDay: "/ hari",
      manualNote:
        "Pembayaran otomatis belum tersambung. Peningkatan paket diaktifkan manual oleh admin setelah konfirmasi — hubungi admin instance ini untuk naik ke Pro atau Team.",
      seePricing: "Lihat harga",
    },
    overview: {
      title: "Ringkasan",
      welcome: "Selamat datang kembali",
      subtitle: "Berikut kondisi gateway Anda hari ini.",
      addProvider: "Tambah provider",
      planLabel: "Paket",
      statKeys: "Kunci provider Anda",
      statKeysHint: (active: string, total: string, shared: string) =>
        shared === "0"
          ? `aktif dari ${total} kunci Anda`
          : `aktif dari ${total} · +${shared} dari Provider Publik`,
      statApiKeys: "API key aktif",
      statApiKeysHint: "milik akun Anda",
      statRequests: "Request hari ini",
      statRequestsHint: "lewat API key Anda",
      statSuccess: "Tingkat sukses",
      statSuccessNone: "belum ada request hari ini",
      statSuccessHint: (ok: string, total: string) => `${ok} dari ${total} berhasil`,
      noticeWithPool: (n: string) =>
        `Anda belum menambahkan kunci provider sendiri. Request tetap dilayani ${n} kunci dari Provider Publik, tetapi kuotanya dipakai bergantian dengan pengguna lain.`,
      noticeWithPoolCta: "Tambahkan kunci sendiri",
      noticeWithPoolPost: "agar kuotanya jadi milik Anda sepenuhnya.",
      noticeEmptyPre: "Belum ada kunci provider yang bisa dipakai akun ini, jadi",
      noticeEmptyPost: "masih akan membalas 503.",
      noticeEmptyCta: "Tambahkan minimal satu kunci provider",
      noticeEmptyEnd: "untuk mengaktifkannya.",
      disabledTitle: (n: number) => `${n} kunci provider Anda sedang nonaktif.`,
      disabledUnknown: "alasan tidak tercatat",
      yourKeys: "Kunci provider Anda",
      yourKeysHint: "Diurutkan sesuai prioritas eksekusi — yang paling atas dicoba lebih dulu.",
      noKeys: "Anda belum menyumbang kunci provider apa pun.",
      priority: "Prioritas",
      defaultModel: "model bawaan preset",
      active: "Aktif",
      inactive: "Nonaktif",
    },
  },
};
