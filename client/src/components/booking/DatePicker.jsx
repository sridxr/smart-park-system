function DatePicker({ label = "Date", value, onChange, min }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-white/15">
      <span className="text-xs uppercase tracking-[0.25em] text-white/40">{label}</span>
      <input
        type="date"
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="app-input mt-3 w-full rounded-xl px-3 py-3 text-sm"
      />
    </label>
  );
}

export default DatePicker;
