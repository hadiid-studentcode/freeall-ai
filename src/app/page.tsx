import Link from "next/link";

const features = [
  {
    title: "Provider key management",
    description:
      "Collect provider API keys, share donated AI capacity, and keep every key healthy with usage and status insights.",
  },
  {
    title: "Smart dashboards",
    description:
      "See active AI providers, usage trends, and available request capacity with a polished, modern admin interface.",
  },
  {
    title: "One place for growth",
    description:
      "Build a central AI marketplace for your team, partners, and customers without managing dozens of separate integrations.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-16">
        <section className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex rounded-full bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700/80">
              Dashboard UI ready
            </div>
            <div className="space-y-6">
              <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Freeall AI
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Build and manage a modern AI provider dashboard with ready-made views for keys, activity, and contribution status.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/10 transition hover:bg-slate-100"
              >
                Open dashboard
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                Explore features
              </a>
            </div>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 ring-1 ring-white/5">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Live insights
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Key performance at a glance
                </h2>
              </div>
              <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-medium text-slate-300">
                100% server rendered
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">Available providers</p>
                <p className="mt-4 text-3xl font-semibold text-white">8</p>
              </div>
              <div className="rounded-3xl bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">Active keys</p>
                <p className="mt-4 text-3xl font-semibold text-white">24</p>
              </div>
              <div className="rounded-3xl bg-slate-950/70 p-5 sm:col-span-2">
                <p className="text-sm text-slate-400">Requests processed today</p>
                <p className="mt-4 text-3xl font-semibold text-white">3,842</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 transition hover:border-slate-600/50 hover:bg-slate-900">
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-4 text-slate-400">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[32px] border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/30 ring-1 ring-white/5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Why Freeall AI</p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Everything your team needs to run an AI-backed service.
              </h2>
            </div>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-slate-950/70 p-6">
              <p className="text-sm uppercase text-slate-500">Insight</p>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Track the health and priority of every provider key in one place so you can route requests reliably.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-6">
              <p className="text-sm uppercase text-slate-500">Collaboration</p>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Add, donate, and manage provider API keys for your team while preserving an elegant dashboard experience.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-6">
              <p className="text-sm uppercase text-slate-500">Velocity</p>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Ship faster with a polished UI designed to make AI operations intuitive from day one.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
