import { BrainCircuit, Sparkles } from "lucide-react";

function AIInsights({ title = "AI mobility insights", subtitle = "", items = [], ctaLabel, onCta }) {
  return (
    <div className="app-surface rounded-[30px] p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-[var(--role-accent)]" />
          <div>
            <h3 className="text-xl font-semibold text-[color:var(--app-text)]">{title}</h3>
            {subtitle ? <p className="text-sm text-[color:var(--app-text-muted)]">{subtitle}</p> : null}
          </div>
        </div>
        {ctaLabel && onCta ? (
          <button type="button" onClick={onCta} className="app-button-primary rounded-2xl px-4 py-3 text-sm font-semibold">
            {ctaLabel}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-[color:var(--app-text-muted)]">
              {item}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-4 text-sm text-[color:var(--app-text-muted)]">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--role-accent)]" />
              Mobility insights will appear here as your trips and demand signals grow.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIInsights;
