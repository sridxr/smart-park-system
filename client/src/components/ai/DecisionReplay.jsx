import { BrainCircuit, MapPinned, ShieldAlert, Sparkles, TimerReset, Wallet, Zap } from "lucide-react";

const stackIcons = {
  rocket: Sparkles,
  wallet: Wallet,
  zap: Zap,
  "map-pin": MapPinned,
};

function DecisionReplay({ replay, loading = false, onRefresh }) {
  const confidenceTone =
    (replay?.confidence || 0) >= 85
      ? "border-emerald-400/20 bg-emerald-500/[0.08]"
      : (replay?.confidence || 0) < 70
        ? "border-amber-400/20 bg-amber-500/[0.08]"
        : "border-sky-400/20 bg-sky-500/[0.08]";

  return (
    <div className="app-surface rounded-[30px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-[var(--role-accent)]" />
          <div>
            <h3 className="text-xl font-semibold text-[color:var(--app-text)]">How was this chosen?</h3>
            <p className="text-sm text-[color:var(--app-text-muted)]">Step-by-step replay of the AI decision path.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRefresh?.()}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-[color:var(--app-text-muted)]"
        >
          Refresh replay
        </button>
      </div>

      <div className={`mt-4 rounded-[24px] border p-4 ${confidenceTone}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--app-text-soft)]">Confidence signal</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
              {replay?.confidenceMessage || "AI replay pending"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold text-[color:var(--app-text)]">{replay?.confidence || 0}%</p>
            <p className="text-sm text-[color:var(--app-text-muted)]">{replay?.strategyLabel || "Smart Balance"}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-soft)]">Stress level</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
            {replay?.stress?.level || "Low"} {replay?.stress?.level === "High" ? "🔴" : replay?.stress?.level === "Medium" ? "🟠" : "🟢"}
          </p>
          <p className="mt-1 text-sm text-[color:var(--app-text-muted)]">Score {replay?.stress?.score || 0}/100</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-soft)]">Time vs money</p>
          <p className="mt-2 text-sm text-[color:var(--app-text)]">{replay?.timeValueOptimizer || "Trade-offs pending."}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-soft)]">Area intelligence</p>
          <p className="mt-2 text-sm text-[color:var(--app-text)]">
            Traffic {replay?.areaIntelligence?.trafficLevel || "Moderate"} | Demand {replay?.areaIntelligence?.demandLevel || "Stable"}
          </p>
          <p className="mt-1 text-sm text-[color:var(--app-text-muted)]">Best time: {replay?.areaIntelligence?.bestTimeToPark || "Now"}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-6 text-sm text-[color:var(--app-text-muted)]">
            AI replay is analyzing the latest route, price, and demand signals...
          </div>
        ) : (
          (replay?.replaySteps || []).map((step) => (
            <div key={step.step} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--app-text-soft)]">{step.step}</p>
              <p className="mt-2 font-semibold text-[color:var(--app-text)]">{step.title}</p>
              <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">{step.detail}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <TimerReset size={15} className="text-[var(--role-accent)]" />
          <p className="text-sm font-medium text-[color:var(--app-text)]">Decision comparison stack</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(replay?.comparisonStack || []).map((item) => {
            const Icon = stackIcons[item.icon] || Sparkles;

            return (
              <div key={`${item.label}-${item.parkingId}`} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <div className="flex items-center gap-2 text-sm text-[color:var(--app-text)]">
                  <Icon size={15} className="text-[var(--role-accent)]" />
                  {item.label}
                </div>
                <p className="mt-2 font-semibold text-[color:var(--app-text)]">{item.title}</p>
                <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">
                  Rs. {item.price} | ETA {item.etaMinutes || 0} min | {item.distanceKm || 0} km
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgba(var(--role-primary-rgb),0.18)] bg-[rgba(var(--role-primary-rgb),0.08)] p-4 text-sm text-[color:var(--app-text)]">
        <div className="flex items-center gap-2">
          <ShieldAlert size={15} className="text-[var(--role-accent)]" />
          Final explanation
        </div>
        <p className="mt-2">{replay?.explanation || "AI explanation will appear here once a recommendation is selected."}</p>
      </div>
    </div>
  );
}

export default DecisionReplay;
