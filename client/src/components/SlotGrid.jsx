function SlotGrid({ slotLayout, title = "Slot Grid", helper = "Live occupancy view" }) {
  const slots = slotLayout?.slots || [];
  const columns = Math.max(1, slotLayout?.columns || 1);

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/55">{helper}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-white/70">
          {slots.filter((slot) => slot.status === "available").length} available
        </div>
      </div>

      <div
        className="mt-5 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {slots.map((slot) => (
          <div
            key={slot.code}
            className={`rounded-2xl border px-3 py-4 text-center text-sm ${
              slot.status === "occupied"
                ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
                : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
            }`}
          >
            <p className="font-medium">{slot.code}</p>
            <p className="mt-1 text-xs opacity-80">{slot.status}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] opacity-60">
              Sensor {slot.sensorStatus || "online"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SlotGrid;
