import { BrainCircuit, TimerReset, Wallet } from "lucide-react";
import { motion as Motion } from "framer-motion";

const strategyIcons = {
  balanced: BrainCircuit,
  cheapest: Wallet,
  fastest: TimerReset,
};

function StrategySelector({ options = [], value = "balanced", onChange }) {
  return (
    <div className="app-surface rounded-[28px] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--app-text-soft)]">Parking strategy</p>
          <h3 className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">Control how AI makes the call</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[color:var(--app-text-muted)]">
          Live adaptive mode
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          const Icon = strategyIcons[option.id] || BrainCircuit;
          const active = value === option.id;

          return (
            <Motion.button
              key={option.id}
              type="button"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onChange?.(option.id)}
              className={`rounded-[24px] border px-4 py-4 text-left transition ${
                active
                  ? "border-[rgba(var(--role-primary-rgb),0.45)] bg-[rgba(var(--role-primary-rgb),0.18)] shadow-[0_12px_40px_rgba(0,0,0,0.24)]"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl p-3 ${active ? "bg-black/20" : "bg-black/10"}`}>
                  <Icon size={18} className="text-[color:var(--app-text)]" />
                </div>
                <div>
                  <p className="font-semibold text-[color:var(--app-text)]">{option.label}</p>
                  <p className="mt-1 text-sm text-[color:var(--app-text-muted)]">{option.helper}</p>
                </div>
              </div>
            </Motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default StrategySelector;
