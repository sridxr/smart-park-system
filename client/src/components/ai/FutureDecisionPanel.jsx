import { GitBranch, Gauge, Sparkles, TrendingUp } from "lucide-react";

function FutureDecisionPanel({ futureSimulation, decisionTree, collectiveInsight }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="app-surface rounded-[30px] p-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-[var(--role-accent)]" />
          <div>
            <h3 className="text-xl font-semibold text-[color:var(--app-text)]">Future-grade forecast</h3>
            <p className="text-sm text-[color:var(--app-text-muted)]">Predicted traffic, price, and availability with uncertainty.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-soft)]">Prediction accuracy</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
              {futureSimulation?.uncertainty?.predictionAccuracy || 0}%
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-soft)]">Traffic certainty</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
              {futureSimulation?.uncertainty?.trafficCertainty || "Medium"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-soft)]">Conflict resolution</p>
            <p className="mt-2 text-sm text-[color:var(--app-text)]">
              {futureSimulation?.decisionConflict || "A clearer separation appears as more forecast data arrives."}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-[rgba(var(--role-accent-rgb),0.18)] bg-[rgba(var(--role-accent-rgb),0.08)] p-4 text-sm text-[color:var(--app-text)]">
          <div className="flex items-center gap-2">
            <Gauge size={15} className="text-[var(--role-accent)]" />
            Self-optimizing system feedback
          </div>
          <p className="mt-2">{futureSimulation?.selfOptimizingFeedback || "Optimization feedback will appear here as the model improves."}</p>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-[color:var(--app-text-muted)]">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-[var(--role-accent)]" />
            Collective intelligence
          </div>
          <p className="mt-2 text-[color:var(--app-text)]">{collectiveInsight?.summary || "Collective intelligence is syncing."}</p>
          <p className="mt-2">{collectiveInsight?.insight || "Shared movement patterns will show here."}</p>
        </div>
      </div>

      <div className="app-surface rounded-[30px] p-6">
        <div className="flex items-center gap-3">
          <GitBranch className="text-[var(--role-accent)]" />
          <div>
            <h3 className="text-xl font-semibold text-[color:var(--app-text)]">Multi-outcome decision tree</h3>
            <p className="text-sm text-[color:var(--app-text-muted)]">See how the best option changes if priorities shift.</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {(decisionTree?.branches || []).map((branch) => (
            <div key={branch.key} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-sm font-medium text-[color:var(--app-text)]">{branch.label}</p>
              <p className="mt-2 text-[color:var(--app-text)]">{branch.title}</p>
              <p className="mt-1 text-sm text-[color:var(--app-text-muted)]">{branch.summary}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[color:var(--app-text)]">
          {decisionTree?.conflictResolution || "Conflict resolution details will appear when options are closely matched."}
        </div>

        <div className="mt-4 rounded-2xl border border-[rgba(var(--role-primary-rgb),0.18)] bg-[rgba(var(--role-primary-rgb),0.08)] p-4 text-sm text-[color:var(--app-text)]">
          {decisionTree?.behavioralModel || "Behavioral modeling will appear as the system learns your pattern."}
        </div>
      </div>
    </div>
  );
}

export default FutureDecisionPanel;
