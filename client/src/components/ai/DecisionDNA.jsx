import { Footprints, MapPinned, Sparkles, TimerReset, Wallet } from "lucide-react";

function DecisionDNA({ profile }) {
  const areas = profile?.preferredAreas || [];
  const style = profile?.decisionStyle || [];

  return (
    <div className="app-surface rounded-[30px] p-6">
      <div className="flex items-center gap-3">
        <Sparkles className="text-[var(--role-accent)]" />
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-soft)]">Decision DNA</p>
          <h3 className="mt-2 text-xl font-semibold text-[color:var(--app-text)]">Your decision style</h3>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm text-[color:var(--app-text-muted)]">
          {profile?.summary || "SmartPark AI is still learning how you balance speed, cost, and route comfort."}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex items-center gap-2 text-sm text-[color:var(--app-text-soft)]">
            <Wallet size={15} />
            Price tendency
          </div>
          <p className="mt-3 font-medium text-[color:var(--app-text)]">
            {profile?.prefersCheap ? "Savings-first chooser" : "Convenience-first chooser"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex items-center gap-2 text-sm text-[color:var(--app-text-soft)]">
            <TimerReset size={15} />
            Route tendency
          </div>
          <p className="mt-3 font-medium text-[color:var(--app-text)]">
            {profile?.prefersFast ? "Low-delay preference" : "Value over speed when needed"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex items-center gap-2 text-sm text-[color:var(--app-text-soft)]">
            <Footprints size={15} />
            Walking tolerance
          </div>
          <p className="mt-3 font-medium text-[color:var(--app-text)]">
            {profile?.walkingTolerance === "long"
              ? "Accepts longer walks"
              : profile?.walkingTolerance === "balanced"
                ? "Comfortable with moderate walks"
                : "Prefers shortest walk"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex items-center gap-2 text-sm text-[color:var(--app-text-soft)]">
            <MapPinned size={15} />
            Learning confidence
          </div>
          <p className="mt-3 font-medium text-[color:var(--app-text)]">{profile?.confidence || 0}% confidence</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {style.map((item) => (
          <div key={item} className="rounded-2xl border border-[rgba(var(--role-accent-rgb),0.18)] bg-[rgba(var(--role-accent-rgb),0.1)] px-4 py-3 text-sm text-[color:var(--app-text)]">
            {item}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {areas.length ? (
          areas.map((area) => (
            <span
              key={area}
              className="rounded-full border border-[rgba(var(--role-primary-rgb),0.25)] bg-[rgba(var(--role-primary-rgb),0.12)] px-3 py-1 text-xs text-[color:var(--app-text)]"
            >
              {area}
            </span>
          ))
        ) : (
          <span className="text-sm text-[color:var(--app-text-muted)]">Area affinity will appear after a few searches and bookings.</span>
        )}
      </div>
    </div>
  );
}

export default DecisionDNA;
