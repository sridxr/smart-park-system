function VehicleSelector({ vehicles = [], selectedVehicleId = "", onChange }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">Vehicle</p>
      <select
        value={selectedVehicleId}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
      >
        <option value="">Select vehicle</option>
        {vehicles.map((vehicle) => (
          <option key={vehicle._id} value={vehicle._id}>
            {[vehicle.label, [vehicle.brand, vehicle.model].filter(Boolean).join(" "), vehicle.number]
              .filter(Boolean)
              .join(" | ")}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-white/45">
        Exact vehicle selection improves compatibility filtering, but checkout still works without it.
      </p>
    </div>
  );
}

export default VehicleSelector;
