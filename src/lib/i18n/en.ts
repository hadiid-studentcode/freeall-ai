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
    metaDescription:
      "An API gateway with smart fallback. Bring your free API keys from Groq, Gemini, Claude and a dozen other providers together behind one endpoint.",
    badge: "Free to use · Self-hostable",
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
      "Fully self-hostable",
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
    selfHost: "Fully self-hostable.",
    disclaimer:
      "Your prompts are forwarded to third-party AI providers and are subject to their own policies. Do not send confidential data.",
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
};
