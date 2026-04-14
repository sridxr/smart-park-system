import { Clock3 } from "lucide-react";

function TimePicker({ label = "Start time", value, onChange }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-white/15">
      <span className="text-xs uppercase tracking-[0.25em] text-white/40">{label}</span>
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 transition hover:border-blue-400/20 hover:bg-white/[0.06]">
        <div className="rounded-full border border-blue-400/20 bg-blue-500/10 p-2 text-blue-200">
          <Clock3 size={14} className="animate-pulse" />
        </div>
        <input
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none"
        />
      </div>
    </label>
  );
}

export default TimePicker;
