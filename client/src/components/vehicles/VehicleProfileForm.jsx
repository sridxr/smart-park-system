function VehicleProfileForm({
  catalog,
  value,
  onChange,
  onSubmit,
  submitLabel = "Save vehicle",
}) {
  const selectedType = value.type || "car";
  const availableBrands = catalog?.brandsByType?.[selectedType] || [];
  const availableModels = catalog?.modelsByTypeBrand?.[`${selectedType}:${value.brand || ""}`] || [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={value.label}
          onChange={(event) => onChange("label", event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
          placeholder="Vehicle label"
        />
        <input
          value={value.number}
          onChange={(event) => onChange("number", event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
          placeholder="Vehicle number"
        />
        <select
          value={selectedType}
          onChange={(event) => onChange("type", event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
        >
          {(catalog?.types || ["car", "bike", "suv", "ev"]).map((type) => (
            <option key={type} value={type}>
              {type.toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={value.brand}
          onChange={(event) => onChange("brand", event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
        >
          <option value="">Select brand</option>
          {availableBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
        <select
          value={value.model}
          onChange={(event) => onChange("model", event.target.value)}
          className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
        >
          <option value="">Select model</option>
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        className="app-button-primary rounded-2xl px-4 py-3 text-sm font-semibold"
      >
        {submitLabel}
      </button>
    </div>
  );
}

export default VehicleProfileForm;
