import type { id } from "@/lib/i18n/id";

/**
 * English dictionary.
 *
 * Typed against the Indonesian dictionary so a missing or renamed key is a
 * compile error rather than a string that silently falls back to Indonesian.
 */
export const en: typeof id = {
  common: {
    dashboard: "Dashboard",
    login: "Sign in",
    register: "Sign up free",
    docs: "Docs",
    pricing: "Pricing",
    howItWorks: "How it works",
    api: "API",
    back: "Back",
    free: "free tier",
    language: "Language",
  },

  home: {
    metaTitle: "FreeAll AI — AI routing without limits",
    metaTermsTitle: "Terms of Service · FreeAll AI",
    metaTermsDesc:
      "Rules for using FreeAll AI: responsibility for API keys, service limits, and prohibited use.",
    metaPrivacyTitle: "Privacy Policy · FreeAll AI",
    metaPrivacyDesc:
      "What we store, how your API keys are protected, and where your prompts are sent.",
    metaPricingTitle: "Pricing · FreeAll AI",
    metaPricingDesc:
      "Free with your own API keys, or subscribe for a larger Public Provider quota.",
    metaDocsTitle: "Documentation · FreeAll AI",
    metaDocsDesc:
      "How FreeAll AI works: request flow, layered fallback, key ownership, and the API reference.",
    metaDescription:
      "An API gateway with smart fallback. Bring your free API keys from Groq, Gemini, Claude and a dozen other providers together behind one endpoint.",
    badge: "Free to use · Bring your own keys",
    titleLead: "AI routing",
    titleAccent: "without limits",
    subtitle:
      "Collect your free API keys from every AI provider in one place. When one key hits its limit, the request is passed to the next model and key automatically — your application never needs to know.",
    ctaPrimary: "Start free",
    ctaPrimaryLoggedIn: "Open dashboard",
    ctaSecondary: "See how it works",
    perks: [
      "No credit card",
      "Keys encrypted with AES-256",
      "Model and key fallback",
      "Ready to use in minutes",
    ],
    demoUnavailableTitle: "Demo is unavailable",
    demoUnavailableBody:
      "The admin has not published any Public Providers for visitors to try. Sign up and add your own free API key to start using the gateway.",

    statsKeys: "Active keys in Public Providers",
    statsRequests: "Requests handled today",
    statsSuccess: "Answered successfully",

    stepsEyebrow: "How it works",
    stepsTitle: "Three steps, no fiddly setup",
    stepLabel: "Step",
    steps: [
      {
        title: "Paste an API key",
        body: "Grab a free key from Groq, Gemini or any other provider and paste it as-is. No need to know the base URL or model name.",
      },
      {
        title: "The system sorts it out",
        body: "The provider is recognised from the shape of the key, live models are queried straight from the source, and the key is tested once before it is saved.",
      },
      {
        title: "Call one endpoint",
        body: "Your application just calls /api/v1/chat. Limits, retired models and provider switching are the gateway's problem.",
      },
    ],

    fallbackEyebrow: "The core",
    fallbackTitle: "Layered fallback, not a plain retry",
    fallbackSubtitle:
      "Free providers meter quota per model, not per account. So the gateway steps down gradually: models first, then keys.",
    fallbackLayers: [
      {
        accent: "Layer 1",
        title: "Model out of quota",
        body: "Free quota is counted per model. When the primary model returns 429, the gateway immediately tries another model on the same key.",
      },
      {
        accent: "Layer 2",
        title: "Key exhausted",
        body: "If every model on that key is spent too, the next key takes over by priority — same provider or a different one.",
      },
      {
        accent: "Layer 3",
        title: "Key rejected",
        body: "A key that returns 401 or 403 is disabled automatically along with the reason, so it stops slowing down later requests.",
      },
    ],

    providersEyebrow: "Providers",
    providersTitle: (count: number) => `${count} providers ready to use`,
    providersSubtitle: (free: number) =>
      `${free} of them have a free tier. Any other OpenAI-compatible provider can be added yourself.`,

    apiEyebrow: "API",
    apiTitle: "One endpoint, every provider",
    apiSubtitle:
      "Generate an API key in the dashboard, then call the same endpoint from your application. The gateway picks the provider.",
    apiNote:
      "means the first key hit its limit and the request was forwarded automatically — your application still got an answer.",
    request: "Request",
    response: "Response",

    finalTitle: "Up and running in a minute",
    finalBody:
      "Sign up, paste one free API key, generate a FreeAll AI key, and your application has an AI gateway with automatic fallback.",
  },

  footer: {
    tagline:
      "AI routing without limits. Bring API keys from every provider together behind one endpoint with automatic fallback.",
    security:
      "Provider keys are encrypted with AES-256-GCM. We never show them in full again — not even to you.",
    product: "Product",
    account: "Account",
    legal: "Legal",
    playground: "Playground",
    terms: "Terms of service",
    privacy: "Privacy policy",
    security_link: "Data security",
    onPremise: "On-premise available for enterprise.",
    disclaimer:
      "Your prompts are forwarded to third-party AI providers and are subject to their own policies. Do not send confidential data.",
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
        "The shared daily demo quota is used up. Sign up free to use the gateway on your own quota.",
      hourlyLimit: (limit: number, minutes: number) =>
        `Demo quota reached — this is a limit from this gateway itself (not from the AI provider): ${limit} conversations per hour per visitor, so the provider keys are not drained. Try again in ${minutes} minute(s), or sign up free for an API key with your own daily quota.`,
      invalidJson: "The request body is not valid JSON.",
      noProvider:
        "No AI provider has been shared for the demo yet. An admin needs to add a key to the Public Providers pool first.",
      allFailed:
        "Every available provider is currently failing or rate-limited. Please try again shortly.",
      internal: "An internal error occurred.",
    },

    auth: {
      invalidEmail: "That email address is not valid.",
      passwordTooShort: (min: number) =>
        `Password must be at least ${min} characters.`,
      emailTaken: "This email is already registered. Please sign in.",
      tooManyAttempts: (minutes: number) =>
        `Too many failed sign-in attempts. Try again in ${minutes} minute(s).`,
      invalidCredentials: "Wrong email or password.",
    },

    billing: {
      invalidSelection: "That plan or billing cycle is not recognized.",
      midtransUnavailable:
        "Automatic payment is unavailable right now. Contact this instance's admin.",
      manualUnavailable: "The manual transfer route is currently closed by the admin.",
      midtransFailed: (detail: string) =>
        `Could not create the Midtrans transaction: ${detail}`,
      orderAlreadyOpen: (orderId: string) =>
        `You still have an unfinished invoice (${orderId}). Complete or cancel it before creating a new one.`,
      manualCreated:
        "Invoice created. Transfer according to the instructions, then press \u201cI have transferred\u201d.",
      proofTooShort:
        "Write your transfer details — for example the sender name and reference number.",
      proofSubmitted: "Thank you. Your invoice is queued for admin review.",
      orderNotFound: "Invoice not found, or it can no longer be changed.",
    },
    apiKey: {
      invalidQuota: "Daily quota must be a whole number between 1 and 100,000.",
      planLimit: (plan: string, max: string) =>
        `The ${plan} plan is limited to ${max} API keys. Delete the ones you no longer use, or upgrade for more capacity.`,
      created: "API key created.",
    },

    provider: {
      disabledVerifyFailed: "Connection test failed when it was added",
      disabledManual: "Disabled manually by its owner",
      disabledRejected: (status: string) => `Rejected by the provider (HTTP ${status})`,
      pickProvider: "Pick an AI provider first.",
      keyEmpty: "The provider API key cannot be empty.",
      invalidPriority: "Priority must be a whole number between 0 and 100.",
      noChatModels: (label: string) =>
        `The provider was detected as ${label}, but no chat model is available for this key. Choose the provider and model manually.`,
      baseUrlRequired: "Base URL is required for providers without a preset.",
      modelRequired: "A model name is required for this provider.",
      duplicate: "This API key is already registered in the system.",
      detectedNote: " (auto-detected from the key)",
      savedDisabled: (label: string, message: string) =>
        `The ${label} key was saved but disabled — the connection test failed: ${message} Double-check the API key, Base URL, and model name.`,
      savedTransient: (label: string, model: string, message: string) =>
        `The ${label} key was added with model ${model}, but the connection test did not succeed (${message}). The key stays active because the cause is likely temporary.`,
      savedOk: (label: string, model: string) =>
        `The ${label} key was added and verified with model ${model}.`,
      fallbackNote: (n: number) =>
        ` ${n} fallback model(s) are ready in case this one hits its limit.`,
    },

    url: {
      invalid: "That Base URL is not valid.",
      httpsRequired: "Base URL must use HTTPS.",
      internalNetwork: "Base URL must not point at an internal network.",
      internalAddress: "Base URL must not point at an internal address.",
      unresolvable: "The Base URL host could not be resolved.",
      resolvesInternal: "The Base URL host resolves to an internal address.",
    },

    discovery: {
      emptyKey: "The API key is empty.",
      recognizedButRejected: (label: string) =>
        `This key was recognized as ${label}, but was rejected when tested. Check whether the key is still active.`,
      unknownProvider:
        "Could not identify the provider from this key. Pick the provider manually, or use the 'Other' option and supply your own Base URL.",
    },

    verify: {
      invalidConfig: "The provider configuration is not valid.",
      unknownError: "Unknown error.",
    },
  },

  auth: {
    loginTitle: "Sign in",
    loginSubtitle: "Sign in to open your FreeAll AI dashboard.",
    registerTitle: "Create an account",
    registerSubtitle: "Sign up to manage your API keys and providers.",
    name: "Name",
    namePlaceholder: "Your name (optional)",
    email: "Email",
    password: "Password",
    passwordHint: "At least 8 characters",
    noAccount: "No account yet?",
    hasAccount: "Already have an account?",
    tagline: "AI routing without limits — an API gateway with smart fallback.",
  },

  demo: {
    title: "Try it now",
    noSignup: "no sign-up needed",
    remaining: "{n} conversations left",
    empty:
      "Ask anything. The gateway picks an available provider and switches automatically when one hits its limit.",
    thinking: "Finding an available provider…",
    placeholder: "Type your question…",
    send: "Send",
    attempts: "attempts",
    networkError: "Network problem. Please try again.",
    gatewayError: "Could not reach the gateway.",
  },

  plans: {
    FREE: {
      label: "Free",
      tagline: "For trying it out and personal projects.",
      features: [
        "Bring unlimited API keys of your own",
        "Fallback across models and keys",
        "Automatic provider detection",
        "Last 7 days of history",
      ],
    },
    PRO: {
      label: "Pro",
      tagline: "For applications people already use.",
      features: [
        "Everything in Free",
        "2,000 requests/day from Public Providers",
        "10 API keys to separate each application",
        "90 days of history",
        "3× more generous burst limit",
      ],
    },
    TEAM: {
      label: "Team",
      tagline: "For teams that need capacity and an audit trail.",
      features: [
        "Everything in Pro",
        "10,000 requests/day from Public Providers",
        "50 API keys",
        "1 year of history for auditing",
        "Priority support",
      ],
    },
    ADMIN: {
      label: "Admin",
      tagline: "Full access as the instance operator.",
      features: ["No plan limits", "Manage Public Providers", "Manage users"],
    },
  },

  pricing: {
    eyebrow: "Pricing",
    title: "Pay only when you need more capacity",
    subtitle:
      "With your own API keys this gateway is free to use — no limits from us. Subscribe only if you want to use our keys, keep history longer, or need more capacity.",
    mostPicked: "Most popular",
    yourPlan: "Your plan",
    perMonth: "/ month",
    freeLabel: "Free",
    currentPlan: "Current plan",
    startFree: "Start free",
    choose: "Choose",
    rowPublicQuota: "Public Provider quota",
    rowApiKeys: "API keys",
    rowHistory: "History",
    rowBurst: "Burst limit",
    perDay: "/ day",
    perMinute: "/ minute",
    days: "days",
    manualNote:
      "Automated payment is not connected yet. For now, plan upgrades are activated manually by an admin after confirmation — get in touch once you have signed up.",
    donateTitle: "Using the free plan and finding it useful?",
    donateBody:
      "Donations help cover the servers and shared provider keys, so the free plan can keep running for everyone.",
    donateCta: "Support the project",
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "If I use my own API key, do the limits still apply?",
        a: "No. The daily quota only applies when you use Public Providers — our keys. Once you add your own key, the quota is entirely yours and we do not cap it.",
      },
      {
        q: "Can we install it on our own servers?",
        a: "Yes, under an enterprise on-premise licence — get in touch to discuss it. Otherwise FreeAll AI is a managed service: quota from our keys, longer history, and no servers to run or provider keys to collect yourself.",
      },
      {
        q: "Can I cancel any time?",
        a: "Yes. A subscription runs until its end date, after which the account returns to the Free plan. Your provider keys and API keys are not deleted.",
      },
      {
        q: "Are core features limited on the free plan?",
        a: "No. Fallback across models and keys, automatic provider detection, and key encryption are available on every plan — including Free. Only capacity differs.",
      },
    ],
  },

  docs: {
    diagrams: {
      flowLabel:
        "How a request travels from your app through the gateway to an AI provider",
      flowApp: "Your app",
      flowAppSub: "sends a prompt",
      flowAuth: "Authentication",
      flowAuthSub: "checks the API key",
      flowLimit: "Rate limit",
      flowLimitSub: "daily quota",
      flowManagerSub: "picks key & model",
      flowProvider: "AI provider",
      flowAnswer: "answer",
      flowLogSub: "history & quota",

      fallbackLabel:
        "Layered fallback: try another model on the same key before switching keys",
      fallbackKey1: "Key #1 — highest priority",
      fallbackKey2: "Key #2 — next priority",
      fallbackPrimary: "Primary model",
      fallbackBackup: "Fallback model",
      fallbackQuotaGone: "429 quota exhausted",
      fallbackSwitchKey: "switch key",
      fallbackSuccess: "200 success",
      fallbackDelivered: "Answer returned to the app",

      scopeLabel:
        "Private keys serve only their owner; Public Providers serve everyone",
      scopeUserA: "User A",
      scopeUserASub: "has their own key",
      scopeVisitor: "Visitor",
      scopeVisitorSub: "demo, no account",
      scopeTriedFirst: "tried first",
      scopePrivateKey: "A's private key",
      scopePrivateKeySub: "only for User A",
      scopeWhenExhausted: "when exhausted",
      scopeOnlyThis: "this only",
      scopePublic: "Public Providers",
      scopePublicSub: "admin-managed · shared",
      scopeNote1: "Another user's private keys are never touched",
      scopeNote2: "by demo visitors or by other users.",
    },

    eyebrow: "Documentation",
    title: "How FreeAll AI works",
    intro:
      "FreeAll AI sits between your application and a dozen AI providers. Your application calls one endpoint; the gateway decides which key to use, which model still has quota, and what to do when a key runs out.",
    sections: {
      flow: "Request flow",
      fallback: "Layered fallback",
      ownership: "Key ownership",
      quota: "Quota & limits",
      api: "API reference",
    },
    stepLabel: "Step",
    flowTitle: "One request, end to end",
    flowSubtitle:
      "Every call passes four stages before it reaches an AI provider. If a stage rejects it, the request stops there and your application is told why.",
    flowSteps: [
      {
        t: "Authentication",
        d: "The Authorization header is matched against your API key. Only its hash is stored, so the original key cannot be read back by anyone.",
      },
      {
        t: "Rate limit",
        d: "The daily quota per API key and the per-minute burst limit are checked. When exhausted, the reply is 429 with an estimate of when it recovers.",
      },
      {
        t: "AiManager",
        d: "The core. It builds the list of keys allowed for this request, then tries them one by one along with their fallback models.",
      },
      {
        t: "Logging",
        d: "The outcome — success or failure, how many attempts, how many milliseconds — is written to RequestLog for history and quota accounting.",
      },
    ],
    fallbackTitle: "Layered fallback",
    fallbackSubtitlePre:
      "This is what separates FreeAll AI from a plain retry. Free providers meter quota",
    fallbackSubtitleBold: "per model",
    fallbackSubtitlePost:
      ", not per account — so a model running out does not necessarily mean the key is spent.",
    failureTableTitle: "What happens on each kind of failure",
    colProviderReply: "Provider reply",
    colMeaning: "What it means",
    colAction: "Gateway action",
    failures: [
      { code: "429", meaning: "Model out of quota", action: "Try the next model on the same key" },
      { code: "404", meaning: "Model has been retired", action: "Try the next model on the same key" },
      { code: "401 / 403", meaning: "Key rejected permanently", action: "Key is disabled automatically, move to the next key" },
      { code: "5xx", meaning: "Temporary outage", action: "Logged, move to the next attempt" },
    ],
    selfHealTitle: "Self-healing",
    selfHealBody:
      "When a fallback model is the one that succeeds, it is promoted to primary. The next request goes straight to what is proven to work instead of wasting an attempt on a model that is out of quota.",
    ownershipTitle: "Whose key serves whom",
    ownershipSubtitle:
      "Keys you register are private. Other users and demo visitors never touch them — the quota you pay for, or collect, stays yours.",
    privateKeyTitle: "Private key",
    privateKeyBody:
      "The default for every key you add. Used only by your account, and always tried before anything else.",
    publicKeyTitle: "Public Providers",
    publicKeyBody:
      "Keys an admin deliberately shares. They act as a fallback for every user and power the landing-page demo that anyone can try without signing up.",
    quotaTitle: "Quota and limits",
    quotaSubtitle:
      "Three layers with different purposes. All of them run before the request reaches an AI provider.",
    colLimit: "Limit",
    colWhoSets: "Who sets it",
    colAppliesTo: "Applies to",
    quotaRows: [
      { limit: "API key daily quota", who: "You", applies: "Each API key, so one application cannot spend everything" },
      { limit: "Public Provider quota", who: "Admin", applies: "Users who have not brought their own key. Lifted once you add a private key" },
      { limit: "Burst limit", who: "System", applies: "Follows your subscription plan, per API key" },
    ],
    apiTitle: "API reference",
    apiSubtitlePre: "One endpoint for every provider. Try it without writing code in the",
    apiSubtitlePost: ".",
    bodyFormsPre: "Besides",
    bodyFormsMid: ", the endpoint accepts multi-turn conversations via",
    bodyFormsOpts: ", plus the options",
    bodyFormsPost: "to force a single provider.",
    bodyFormsTitle: "Other body shapes",
    statusTitle: "Status codes",
    colCode: "Code",
    colMeaningShort: "Meaning",
    providersTitle: (n: number) => `${n} providers detected automatically`,
    providersBody:
      "Paste an API key as-is — the provider is recognised from the shape of the key, and live models are queried straight from the source.",
    ctaTitle: "Ready to try?",
    ctaBody:
      "Sign up, paste one free API key, then call the same endpoint from your application.",
    statusCodes: [
      { code: "200", meaning: "Success. Check `attempts` to see how many tries it took." },
      { code: "400", meaning: "Invalid body — `prompt` or `messages` missing, or malformed." },
      { code: "401", meaning: "API key missing, wrong, or disabled." },
      { code: "429", meaning: "Daily quota or burst limit exceeded. See the `Retry-After` header." },
      { code: "503", meaning: "No usable provider key, or all of them failed." },
    ],
  },

  terms: {
    eyebrow: "Terms of Service",
    title: "Rules of use",
    intro: "By using FreeAll AI, you agree to the following.",
    notice:
      "FreeAll AI is an intermediary. We do not run AI models ourselves — every request is forwarded to a third-party provider using an API key you or an admin registered, and is subject to their terms.",
    sections: [
      {
        title: "1. The API keys you register",
        body: [
          "You confirm you are entitled to use every API key you register, and that using it through FreeAll AI does not breach the terms of the provider it came from. You are fully responsible for the cost, quota and consequences of using that key.",
          "Keys marked as public will be used by other users and demo visitors. Mark a key public only if you are genuinely willing to share its quota.",
        ],
      },
      {
        title: "2. Service limits and quota",
        body: [
          "Daily quota, burst limits and API key counts follow your active plan. We may adjust these at any time — particularly on the free plan — to keep the service running for everyone.",
          "Availability depends on third-party providers. We do not promise any service level (SLA) on the free plan.",
        ],
      },
      {
        title: "3. What is not allowed",
        body: [
          "Registering API keys that are not yours or were obtained without permission. Attempting to access another user's keys, data or account. Using the service for unlawful activity, or anything prohibited by the relevant AI provider's terms. Creating multiple accounts to evade quota limits. Loading the service automatically beyond reasonable limits.",
          "Violations may result in an API key being disabled or an account removed without prior notice.",
        ],
      },
      {
        title: "4. Conversation content",
        body: [
          "You are responsible for the prompts you send and the answers you use. AI model output can be wrong, biased or fabricated — do not make it the sole basis for important decisions, especially in medical, legal or financial matters.",
        ],
      },
      {
        title: "5. Subscription and payment",
        body: [
          "A paid plan runs until its end date, after which the account returns to the free plan. Your provider keys and API keys are not deleted when a subscription ends. Payments already made are non-refundable, unless we are unable to provide the service.",
        ],
      },
      {
        title: "6. Limitation of liability",
        body: [
          "The service is provided as is. We are not liable for losses arising from exhausted quota, keys disabled by a provider, third-party outages, or decisions made based on AI model output.",
        ],
      },
      {
        title: "7. On-premise installation",
        body: [
          "These terms apply to the instance we operate. Installing on your own infrastructure is available only under a written on-premise licence; its terms are set out in a separate agreement, and responsibility for operation, security and compliance rests with you.",
        ],
      },
      {
        title: "8. Changes",
        body: [
          "These terms may change. Changes take effect when published on this page. By continuing to use the service after a change, you are deemed to accept it.",
        ],
      },
    ],
  },

  privacy: {
    eyebrow: "Privacy Policy",
    title: "Your data, and what we do with it",
    intro:
      "Written as briefly and plainly as possible, because you are entrusting us with something sensitive: your own API keys.",
    warningBold: "Do not send confidential data in prompts.",
    warningBody:
      "Your conversation content is forwarded to third-party AI providers (Groq, Google, Anthropic and others) and is subject to their own retention policies, outside our control.",
    storageTitle: "How provider API keys are stored",
    encryptedTitle: "Encrypted, not encoded",
    encryptedBody:
      "Provider keys are encrypted with AES-256-GCM before they reach the database. Only their SHA-256 is stored in the unique column, used to stop the same key being registered twice.",
    unreadableTitle: "Cannot be read back",
    unreadableBody:
      "FreeAll AI keys are stored only as a hash. We cannot show them again — not even to you. If one is lost, the old key is deleted and a new one issued.",
    previewNote: "In the dashboard, keys appear only as a fragment such as",
    previewNotePost: "— enough to recognise, not enough to use.",
    storedTitle: "What we store",
    stored: [
      { label: "Account", body: "Email, name (optional) and a password hashed with scrypt. The original password is never stored." },
      { label: "Provider keys", body: "Encrypted, along with the provider, model and usage statistics." },
      { label: "Request history", body: "Time, provider, model, success or failure, attempt count and response time. Prompt and answer content is not stored." },
      { label: "Login sessions", body: "Session tokens are stored as hashes; the cookie in your browser carries the original value." },
    ],
    notDoTitle: "What we do not do",
    notDo: [
      "We do not sell or share your data with third parties.",
      "We do not use your prompts to train any model.",
      "We do not use your private keys to serve other users' requests. Keys are shared only when you — or an admin, for their own keys — mark them public.",
    ],
    thirdPartyTitle: "Third parties",
    thirdPartyBody:
      "Every prompt is forwarded to the AI provider whose key is used. They have their own privacy policies and retention periods. We do not control what they do with that data, so treat every prompt as something someone else may read.",
    deleteTitle: "Deleting data",
    deleteBody:
      "You can delete provider keys and API keys at any time from the dashboard; deletion takes effect immediately. To delete your entire account and its data, contact the admin of this instance.",
    onPremiseTitle: "On-premise installation",
    onPremiseBody:
      "For customers with an on-premise licence, all data lives on your own infrastructure and this policy does not apply — you are the data controller. Keep ENCRYPTION_KEY safe: without it, stored keys can no longer be decrypted.",
  },

  dash: {
    nav: {
      overview: "Overview",
      providers: "AI Providers",
      apiKeys: "API Keys",
      playground: "Playground",
      logs: "History",
      plan: "Plan",
      admin: "Admin",
    },
    logout: "Sign out",

    apiKeys: {
      title: "API Keys",
      subtitlePre:
        "Authorization keys for calling the FreeAll AI gateway from your own app.",
      subtitleBold: "Daily quota",
      subtitlePost:
        "is a usage brake: once today's request count hits that number, the endpoint returns 429 until midnight — handy so one app cannot drain every provider key. You can change it any time.",
      createTitle: "Create a new API key",
      createHintPre: "Your app uses this key to call",
      name: "Name",
      namePlaceholder: "e.g. Production App",
      dailyQuota: "Daily quota",
      create: "Create key",
      copyNowTitle: "Copy it now — this key will never be shown again.",
      copyNowBody:
        "The database only stores its hash, so not even we can recover it. If you lose it, create a new one.",
      copy: "Copy",
      yourKeys: "Your keys",
      noKeys: "No keys yet.",
      registered: (n: number) => `${n} key(s) registered.`,
      empty: "Create your first key using the form above.",
      colName: "Name",
      colKey: "Key",
      colStatus: "Status",
      colUsage: "Usage today",
      colLastUsed: "Last used",
      colCreated: "Created",
      colActions: "Actions",
      save: "Save",
      active: "Active",
      inactive: "Disabled",
      disable: "Disable",
      enable: "Enable",
      remove: "Delete key",
    },

    providers: {
      title: "AI Providers",
      subtitle:
        "Keys you register join the fallback pool. When one key hits its limit (429), the gateway automatically forwards the request to the next key by priority.",
      registered: "Registered keys",
      noKeys: "No keys yet.",
      count: (n: number) => `${n} key(s), sorted in execution order.`,
      empty: "Add your first key using the form above.",
      colProvider: "Provider",
      colModel: "Model",
      colStatus: "Status",
      colPriority: "Priority",
      colSuccess: "Success / Failed",
      colLastUsed: "Last used",
      colActions: "Actions",
      fallbackModels: (n: number) => `+${n} fallback model(s)`,
      public: "Public",
      private: "Private",
      publicTitle: "Public — used by every user and the front-page demo",
      privateTitle: "Used only by your account",
      makePrivate: "Make private",
      makePublic: "Make public",
      save: "Save",
      active: "Active",
      inactive: "Disabled",
      disable: "Disable",
      enable: "Re-enable",
      refresh: "Refresh model list from the provider",
      remove: "Delete key",
    },

    providerForm: {
      title: "Add a provider key",
      description:
        "Paste your API key — the system identifies the provider itself, finds a model that is still live, then tests it. Keys are encrypted with AES-256-GCM before storage and are never shown in full again.",
      apiKey: "API key",
      apiKeyPlaceholder: "Paste an API key from any provider",
      autoHint:
        "Supports Groq, Gemini, Claude, OpenRouter, Cerebras, NVIDIA, xAI, DeepSeek, Mistral, and more.",
      getKeyAt: "Get a key at",
      provider: "Provider",
      autoOption: "✨ Auto-detect (recommended)",
      freeTier: " — has a free tier",
      priority: "Priority",
      priorityHint: "Higher means tried earlier (0–100).",
      baseUrl: "Base URL",
      optional: "(optional)",
      baseUrlPlaceholder: "https://api.example.com/v1",
      model: "Model (optional)",
      modelPlaceholder: "chosen automatically if left empty",
      modelHint: "Leave empty to let the system pick a live model from the provider.",
      shareTitle: "Share with the Public Providers pool",
      shareBody:
        "The key is used by every registered user and the front-page demo. If unchecked, this key stays private to your account.",
      autoBadge: "Base URL & model are set automatically",
      submit: "Add key",
      submitting: "Detecting & testing…",
    },

    admin: {
      paymentTitle: "Payments",
      paymentDesc:
        "Decide which routes users may take to upgrade. The Midtrans route only truly opens once its credentials are in place.",
      modeLabel: "Payment route",
      modeOFF: "Close everything — nobody can self-upgrade",
      modeMANUAL: "Manual transfer only — the admin confirms",
      modeMIDTRANS: "Midtrans only — automatic",
      modeBOTH: "Both — the buyer chooses",
      modeNotReady:
        "This mode needs Midtrans credentials, which are not configured. Until they are, the Midtrans route stays closed to users.",
      instructionsLabel: "Manual transfer instructions",
      instructionsPlaceholder:
        "Example:\nBCA 1234567890 under Your Name\nInclude the order number in the transfer memo.",
      instructionsHint: "Shown to buyers when they pick manual transfer.",
      midtransTitle: "Midtrans credentials",
      midtransFromEnv:
        "Read from environment variables. Values entered here are ignored while env is set — change them in your deploy configuration.",
      midtransFromDb: "Configured from this dashboard, stored encrypted.",
      midtransMissing: "Not configured.",
      serverKey: "Server key",
      clientKey: "Client key",
      production: "Production mode (not sandbox)",
      saveCredentials: "Save credentials",
      clearCredentials: "Delete credentials",
      webhookTitle: "Notification URL",
      webhookHint:
        "Register this address in the Midtrans dashboard → Settings → Configuration → Payment Notification URL. Without it, plans will never activate automatically.",
      sandboxBadge: "Sandbox",
      productionBadge: "Production",

      queueTitle: "Manual transfer review",
      queueDesc:
        "Invoices whose buyers claim to have transferred. Approve only after you can see the money in your account.",
      queueEmpty: "Nothing waiting for review.",
      queueColUser: "Buyer",
      queueColOrder: "Order",
      queueColPlan: "Plan",
      queueColAmount: "Amount",
      queueColNote: "Buyer's note",
      queueColCreated: "Created",
      approve: "Approve",
      reject: "Reject",
      adminNotePlaceholder: "Note (optional)",
      title: "Admin",
      subtitle:
        "Manage Public Providers and users. Keys in the Public Providers pool serve every registered account and also power the front-page demo that visitors can try without signing up.",
      statUsers: "Users",
      statUsersHint: (n: number) => `${n} admin(s)`,
      statPublicKeys: "Public keys",
      statPublicKeysHint: (total: string) => `of ${total} keys total`,
      statRequests: "Requests today",
      statRequestsHint: (n: string) => `${n} from the demo`,
      statSuccess: "Success rate",
      statSuccessNone: "no requests yet",
      emptyPoolPre:
        "The Public Providers pool is empty, so the front-page demo and users without their own keys will get a 503. Add a key under",
      emptyPoolCta: "AI Providers",
      emptyPoolPost: "and tick \u201cShare with the Public Providers pool\u201d.",
      quotaTitle: "Quota for users without their own keys",
      quotaDescPre:
        "A daily cap for users relying on Public Providers. The moment they add their own provider key, this cap goes away. Set it to",
      quotaDescPost: "to close off Public Provider usage entirely.",
      quotaField: "Requests per day",
      save: "Save",
      quotaNote: "Takes effect from the next request.",
      poolTitle: "Public Providers",
      poolDesc: "Keys used by every user and the front-page demo.",
      poolEmpty: "No keys have been shared yet.",
      colProvider: "Provider",
      colModel: "Model",
      colOwner: "Owner",
      colStatus: "Status",
      colSuccess: "Success / Failed",
      colLastUsed: "Last used",
      colActions: "Actions",
      system: "system",
      active: "Active",
      inactive: "Disabled",
      makePrivate: "Make private",
      catalogTitle: "Provider catalog",
      catalogDesc:
        "Add a new AI provider without redeploying. Whatever is saved here shows up immediately on the landing page, the docs, and the key registration form. Built-in providers need no entry here.",
      catalogSlug: "Slug — e.g. novita",
      catalogLabel: "Display name — Novita AI",
      catalogFormat: "API format",
      catalogFormatOpenai: "OpenAI format",
      catalogFormatGemini: "Gemini format",
      catalogFormatAnthropic: "Anthropic format",
      catalogModel: "Default model",
      catalogConsole: "API key page URL (optional)",
      catalogFree: "Has a free tier",
      catalogSubmit: "Add provider",
      catalogFreeBadge: "free",
      remove: "Delete",
      usersTitle: "Users",
      usersDesc: (n: number) =>
        `${n} registered account(s). Admins can share keys into the Public Providers pool; regular users rely on their own keys plus that pool.`,
      colEmail: "Email",
      colName: "Name",
      colRole: "Role",
      colPlan: "Plan",
      colProviderKeys: "Provider keys",
      colApiKeys: "API keys",
      colJoined: "Joined",
      you: "(you)",
      planAria: (email: string) => `Plan for ${email}`,
      durationAria: "Duration (days)",
      durationTitle: "Duration in days; 0 = unlimited",
      set: "Set",
      until: "until",
      makeUser: "Make user",
      makeAdmin: "Make admin",
      removeUser: "Delete this user and all their keys",
    },

    billing: {
      title: "Upgrade your plan",
      subtitle:
        "Pick a plan and a billing cycle. Remaining time is not forfeited — it is added to the new period.",
      closed:
        "This instance's admin has not opened a payment route yet. Contact the admin to upgrade.",
      cycleMonthly: "Monthly",
      cycleYearly: "Yearly",
      yearlyBadge: "Save 2 months",
      perMonth: "/ month",
      perYear: "/ year",
      savings: (amount: string) => `Save ${amount} versus paying monthly`,
      payMidtrans: "Pay with Midtrans",
      payManual: "Manual transfer",
      processing: "Processing…",
      sandboxNotice:
        "Midtrans is still in sandbox mode — payments do not move real money.",

      openTitle: "Open invoice",
      orderId: "Order number",
      amount: "Amount",
      created: "Created",
      due: "Due",
      continuePayment: "Continue payment",
      cancelOrder: "Cancel",
      manualHowTo: "How to pay",
      noInstructions:
        "The admin has not written transfer instructions yet. Contact them for account details.",
      proofLabel: "Transfer details",
      proofPlaceholder: "e.g. BCA transfer from Budi, ref 1234567",
      proofSubmit: "I have transferred",
      awaitingReview:
        "Waiting for admin review. Your plan activates once the transfer is matched.",

      historyTitle: "Payment history",
      historyEmpty: "No transactions yet.",
      colDate: "Date",
      colPlan: "Plan",
      colAmount: "Amount",
      colMethod: "Method",
      colStatus: "Status",
      methodMidtrans: "Midtrans",
      methodManual: "Manual transfer",
      statusPENDING: "Awaiting payment",
      statusAWAITING_REVIEW: "Awaiting review",
      statusPAID: "Paid",
      statusFAILED: "Failed",
      statusEXPIRED: "Expired",
      statusCANCELLED: "Cancelled",
      returnedPaid: "Payment received — your plan is active.",
      returnedPending:
        "Payment is not confirmed yet. If you have paid, the status will update on its own within a few minutes.",
    },

    logs: {
      title: "Request history",
      subtitlePre: "The",
      subtitleBold: "Attempts",
      subtitleMid:
        "column shows how many key-and-model combinations were tried before the request finished — anything above 1 means fallback did its job.",
      subtitleAdmin:
        "As an admin, conversations from the front-page demo also appear here, tagged Demo.",
      subtitleUser: "Only requests made with your API keys appear here.",
      retention: (plan: string, days: string) =>
        `The ${plan} plan shows the last ${days} days of history.`,
      lastN: (n: number) => `Last ${n} requests`,
      none: "No requests recorded yet.",
      showing: (n: number) => `Showing the ${n} most recent entries.`,
      emptyPre: "Send your first request to",
      emptyPost: "to see its history here.",
      colTime: "Time",
      colStatus: "Status",
      colProvider: "Provider",
      colModel: "Model",
      colAttempts: "Attempts",
      colLatency: "Latency",
      colSource: "Source",
      success: "Success",
      failed: "Failed",
      demo: "Demo",
    },

    playground: {
      title: "Playground",
      subtitle:
        "Test the gateway endpoint right here — with real Authorization headers, status codes, and response times.",
      noKeyPre: "You have no active API key yet.",
      noKeyCta: "Create one on the API Keys page",
      noKeyPost: "then paste it here.",
      requestTitle: "Request",
      requestHintPre: "Calls",
      requestHintPost: "exactly the way your own app would.",
      apiKeyLabel: "FreeAll AI API key",
      apiKeyHint:
        "The key is not stored — it is only used for this request from your browser.",
      promptLabel: "Prompt",
      promptDefault: "Hi! Introduce yourself briefly.",
      forceProvider: "Force a provider (optional)",
      auto: "Automatic — by priority",
      forceHint:
        "Useful for testing a single provider without disabling the others.",
      send: "Send request",
      sending: "Sending…",
      needKey: "Enter your FreeAll AI API key first.",
      sendFailed: "The request could not be sent.",
      responseTitle: "Response",
      doneIn: "Completed in {n} ms",
      notSent: "No request sent yet.",
      placeholder: "Fill in the API key and prompt, then press Send request.",
      curlTitle: "cURL equivalent",
      curlHint: "Copy this to use in your terminal or app.",
    },
    plan: {
      adminLabel: "Admin",
      adminTagline: "Full access as the instance operator.",
      title: "Plan & Quota",
      subtitle:
        "The limits that apply to your account and how much you have used today.",
      compare: "Compare plans",
      expiring: (n: number, date: string) =>
        `Your plan ends in ${n} days (${date}). After that the account returns to the Free plan — your provider keys and API keys are not deleted.`,
      planPrefix: "Plan",
      activeBadge: "Active",
      perMonth: "/ month",
      meterApiKeys: "API keys",
      meterApiKeysHint: (used: string, max: string) => `${used} of ${max} used`,
      meterPublic: "Public Provider quota today",
      meterPublicNa: "Not applicable — you use your own keys",
      factHistory: "History kept",
      factBurst: "Burst limit",
      days: "days",
      perMinute: "requests / minute",
      usingPoolPre: "You are using",
      usingPoolBold: "Public Providers",
      usingPoolMid: "— the operator's keys, shared with other users.",
      usingPoolCta: "Add your own provider key",
      usingPoolPost: "and this daily limit is lifted entirely, whatever your plan.",
      ownKeysPre: (n: number) => `You are using your own provider keys (${n} active), so there is`,
      ownKeysBold: "no daily quota limit",
      ownKeysPost: "from us. Only each AI provider's own quota applies.",
      availableTitle: "Available plans",
      yourPlan: "Your plan",
      rowPublic: "Public Providers",
      rowApiKeys: "API keys",
      rowHistory: "History",
      rowBurst: "Burst",
      perDay: "/ day",
      manualNote:
        "Automated payment is not connected yet. Plan upgrades are activated manually by an admin after confirmation — contact this instance's admin to move to Pro or Team.",
      seePricing: "See pricing",
    },
    overview: {
      title: "Overview",
      welcome: "Welcome back",
      subtitle: "Here is how your gateway is doing today.",
      addProvider: "Add provider",
      planLabel: "Plan",
      statKeys: "Your provider keys",
      statKeysHint: (active: string, total: string, shared: string) =>
        shared === "0"
          ? `active of your ${total} keys`
          : `active of ${total} · +${shared} from Public Providers`,
      statApiKeys: "Active API keys",
      statApiKeysHint: "belonging to your account",
      statRequests: "Requests today",
      statRequestsHint: "through your API keys",
      statSuccess: "Success rate",
      statSuccessNone: "no requests yet today",
      statSuccessHint: (ok: string, total: string) => `${ok} of ${total} succeeded`,
      noticeWithPool: (n: string) =>
        `You have not added any provider keys of your own. Requests are still served by ${n} keys from Public Providers, but that quota is shared with other users.`,
      noticeWithPoolCta: "Add your own key",
      noticeWithPoolPost: "and the quota becomes entirely yours.",
      noticeEmptyPre: "No provider key is available to this account yet, so",
      noticeEmptyPost: "will still return 503.",
      noticeEmptyCta: "Add at least one provider key",
      noticeEmptyEnd: "to activate it.",
      disabledTitle: (n: number) => `${n} of your provider keys are currently disabled.`,
      disabledUnknown: "reason not recorded",
      yourKeys: "Your provider keys",
      yourKeysHint: "Ordered by execution priority — the topmost is tried first.",
      noKeys: "You have not contributed any provider keys yet.",
      priority: "Priority",
      defaultModel: "preset default model",
      active: "Active",
      inactive: "Disabled",
    },
  },
};
