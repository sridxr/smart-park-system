import { BrainCircuit, MapPinned, Sparkles } from "lucide-react";

function IntentPredictionCard({ intent, onAccept }) {
  return (
    <div className="app-surface rounded-[30px] p-6">
      <div className="flex items-center gap-3">
        <BrainCircuit className="text-[var(--role-accent)]" />
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-soft)]">Pre-action AI</p>
          <h3 className="mt-2 text-xl font-semibold text-[color:var(--app-text)]">Intent prediction</h3>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-[rgba(var(--role-primary-rgb),0.18)] bg-[rgba(var(--role-primary-rgb),0.08)] p-4">
        <p className="text-sm font-medium text-[color:var(--app-text)]">
          {intent?.message || "Intent prediction is waiting for a stronger routine signal."}
        </p>
        <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">
          {intent?.behavioralModel || "The model compares your time of day, recent patterns, and preferred locations."}
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        {(intent?.reasoning || []).map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-[color:var(--app-text-muted)]">
            {item}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <div className="flex items-center gap-3">
          <MapPinned size={16} className="text-[var(--role-accent)]" />
          <div>
            <p className="font-medium text-[color:var(--app-text)]">{intent?.predictedDestination?.label || "Destination still learning"}</p>
            <p className="text-sm text-[color:var(--app-text-muted)]">{intent?.timeContext?.label || "Pattern scan"}</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[color:var(--app-text-muted)]">
          {intent?.confidence || 0}% confidence
        </span>
      </div>

      {intent?.detected ? (
        <button type="button" onClick={onAccept} className="app-button-primary mt-4 rounded-2xl px-4 py-3 text-sm font-semibold">
          Use predicted destination
        </button>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-sm text-[color:var(--app-text-muted)]">
          <Sparkles size={15} className="text-[var(--role-accent)]" />
          More repeated searches or saved places will make this prediction stronger.
        </div>
      )}
    </div>
  );
}

export default IntentPredictionCard;
