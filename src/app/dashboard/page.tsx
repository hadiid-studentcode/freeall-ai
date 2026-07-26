const summaryCards = [
  { label: "Provider keys", value: "24", delta: "+12%" },
  { label: "Active providers", value: "8", delta: "+8%" },
  { label: "Requests today", value: "3.8k", delta: "+34%" },
];

const providers = [
  {
    provider: "Gemini",
    status: "Active",
    priority: 10,
    owner: "Admin",
    lastActive: "2 mins ago",
  },
  {
    provider: "Groq",
    status: "Active",
    priority: 9,
    owner: "Team Beta",
    lastActive: "6 mins ago",
  },
  {
    provider: "Gemini",
    status: "Paused",
    priority: 2,
    owner: "Guest",
    lastActive: "1h ago",
  },
  {
    provider: "Custom AI",
    status: "Active",
    priority: 7,
    owner: "Partner",
    lastActive: "18 mins ago",
  },
];

function statusBadge(status: string) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ";
  if (status === "Active") {
    return base + "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25";
  }
  if (status === "Paused") {
    return base + "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20";
  }
  return base + "bg-slate-700/70 text-slate-200 ring-1 ring-white/10";
}

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Overview
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              AI provider dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Review the latest provider key health, usage numbers, and provider activity in one intuitive admin view.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="inline-flex items-center justify-center rounded-full bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Add provider key
            </button>
            <button className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-600">
              Sync status
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
                {card.label}
              </p>
              <p className="mt-4 text-3xl font-semibold text-white">{card.value}</p>
              <p className="mt-2 text-sm text-emerald-300">{card.delta} vs yesterday</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Provider keys</h2>
              <p className="mt-2 text-sm text-slate-400">Monitor active and paused provider keys with priority and last activity.</p>
            </div>
            <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              24 keys
            </span>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-950/90 text-slate-400">
                <tr>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Last active</th>
                  <th className="px-6 py-4">Owner</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={`${provider.provider}-${provider.priority}-${provider.owner}`} className="border-t border-white/5 hover:bg-slate-950/80">
                    <td className="px-6 py-5 font-medium text-white">{provider.provider}</td>
                    <td className="px-6 py-5">
                      <span className={statusBadge(provider.status)}>{provider.status}</span>
                    </td>
                    <td className="px-6 py-5 text-slate-300">{provider.priority}</td>
                    <td className="px-6 py-5 text-slate-300">{provider.lastActive}</td>
                    <td className="px-6 py-5 text-slate-300">{provider.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">Activity feed</h2>
            <p className="mt-2 text-sm text-slate-400">Recent provider key events and insights for your team.</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-slate-950/90 p-4">
                <p className="text-sm text-slate-300">Gemini key used for 250 requests. Priority remains healthy.</p>
                <p className="mt-2 text-xs text-slate-500">3 minutes ago</p>
              </div>
              <div className="rounded-3xl bg-slate-950/90 p-4">
                <p className="text-sm text-slate-300">Groq donation key added by Team Beta.</p>
                <p className="mt-2 text-xs text-slate-500">12 minutes ago</p>
              </div>
              <div className="rounded-3xl bg-slate-950/90 p-4">
                <p className="text-sm text-slate-300">Paused a low-performing provider to preserve request capacity.</p>
                <p className="mt-2 text-xs text-slate-500">1 hour ago</p>
              </div>
            </div>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">Today&apos;s highlights</h2>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="rounded-3xl bg-slate-950/90 p-4">Uptime across active providers stays above 99.7%.</li>
              <li className="rounded-3xl bg-slate-950/90 p-4">Average request latency improved by 15% compared to yesterday.</li>
              <li className="rounded-3xl bg-slate-950/90 p-4">Recommended action: add one more donation key for peak traffic.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
