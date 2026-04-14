import { ArrowRightLeft, CalendarClock, Clock3, Sparkles } from "lucide-react";
import TimeShiftSlider from "./TimeShiftSlider";

const presets = [30, 60, 120];

function SimulationPanel({ simulation, minutesOffset = 30, onOffsetChange, onApply, showSlider = true }) {
  const baseline = simulation?.baseline;
  const scenario = simulation?.scenario;

  return (
    <div className="app-surface rounded-[30px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarClock className="text-[var(--role-accent)]" />
          <div>
            <h3 className="text-xl font-semibold text-[color:var(--app-text)]">What-if simulator</h3>
            <p className="text-sm text-[color:var(--app-text-muted)]">Preview how price, traffic, and availability may change.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onOffsetChange?.(preset)}
              className={`rounded-full border px-3 py-2 text-xs transition ${
                preset === minutesOffset
                  ? "border-[rgba(var(--role-primary-rgb),0.4)] bg-[rgba(var(--role-primary-rgb),0.16)] text-[color:var(--app-text)]"
                  : "border-white/10 bg-white/[0.04] text-[color:var(--app-text-muted)]"
              }`}
            >
              +{preset} min
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-medium text-[color:var(--app-text)]">{simulation?.scenarioLabel || "Run a scenario"}</p>
        <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">
          {simulation?.explanation || "Pick a later time to see how SmartPark AI expects the parking landscape to change."}
        </p>
      </div>

      {showSlider ? (
        <div className="mt-4">
          <TimeShiftSlider value={minutesOffset} onChange={onOffsetChange} />
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-soft)]">Now</p>
          <p className="mt-2 font-semibold text-[color:var(--app-text)]">{baseline?.title || "No baseline yet"}</p>
          <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">
            Rs. {baseline?.price || 0} | ETA {baseline?.etaMinutes || 0} min | {baseline?.availableSlots || 0} slots
          </p>
        </div>
        <div className="flex items-center justify-center text-[color:var(--app-text-soft)]">
          <ArrowRightLeft size={18} />
        </div>
        <div className="rounded-2xl border border-[rgba(var(--role-accent-rgb),0.16)] bg-[rgba(var(--role-accent-rgb),0.08)] p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-soft)]">Scenario</p>
          <p className="mt-2 font-semibold text-[color:var(--app-text)]">{scenario?.title || "No scenario yet"}</p>
          <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">
            Rs. {scenario?.price || 0} | ETA {scenario?.etaMinutes || 0} min | {scenario?.availableSlots || 0} slots
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {(simulation?.summary || []).map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-[color:var(--app-text)]">
            {item}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <div className="flex items-center gap-2 text-sm text-[color:var(--app-text-soft)]">
          <Clock3 size={15} />
          Time value optimizer
        </div>
        <p className="mt-2 text-sm text-[color:var(--app-text)]">{simulation?.timeValueOptimizer || "Trade-offs will appear here."}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <div className="flex items-center gap-2 text-sm text-[color:var(--app-text-soft)]">
          <Sparkles size={15} />
          Area intelligence
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <p className="text-sm text-[color:var(--app-text-muted)]">Traffic: {simulation?.areaIntelligence?.trafficLevel || "Moderate"}</p>
          <p className="text-sm text-[color:var(--app-text-muted)]">Demand: {simulation?.areaIntelligence?.demandLevel || "Stable"}</p>
          <p className="text-sm text-[color:var(--app-text-muted)]">Avg price: Rs. {simulation?.areaIntelligence?.averagePrice || 0}</p>
          <p className="text-sm text-[color:var(--app-text-muted)]">Best time: {simulation?.areaIntelligence?.bestTimeToPark || "Now"}</p>
        </div>
      </div>

      {scenario ? (
        <button
          type="button"
          onClick={() => onApply?.(scenario.parkingId)}
          className="app-button-primary mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold"
        >
          Apply scenario recommendation
        </button>
      ) : null}
    </div>
  );
}

export default SimulationPanel;
