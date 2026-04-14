import { Clock3 } from "lucide-react";

function TimeShiftSlider({ value = 60, onChange }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[color:var(--app-text)]">
          <Clock3 size={16} className="text-[var(--role-accent)]" />
          Time shift
        </div>
        <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs text-[color:var(--app-text-muted)]">
          +{value} min
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="120"
        step="15"
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
        className="mt-4 w-full"
      />
      <div className="mt-2 flex justify-between text-xs text-[color:var(--app-text-soft)]">
        <span>Now</span>
        <span>+30 min</span>
        <span>+1 hour</span>
        <span>+2 hours</span>
      </div>
    </div>
  );
}

export default TimeShiftSlider;
