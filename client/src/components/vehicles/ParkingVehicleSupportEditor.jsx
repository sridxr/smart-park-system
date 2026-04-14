function ToggleChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm transition ${
        active
          ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-50"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function ParkingVehicleSupportEditor({ catalog, values, onToggle }) {
  const selectedTypes = values.supportedVehicleTypes || [];
  const availableBrands = selectedTypes.length
    ? [...new Set(selectedTypes.flatMap((type) => catalog?.brandsByType?.[type] || []))]
    : [];
  const availableModels = selectedTypes.length
    ? [
        ...new Set(
          availableBrands.flatMap((brand) =>
            selectedTypes.flatMap((type) => catalog?.modelsByTypeBrand?.[`${type}:${brand}`] || [])
          )
        ),
      ]
    : [];

  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Supported Vehicle Types</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(catalog?.types || []).map((type) => (
            <ToggleChip
              key={type}
              active={selectedTypes.includes(type)}
              onClick={() => onToggle("supportedVehicleTypes", type)}
            >
              {type.toUpperCase()}
            </ToggleChip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Preferred Brands</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableBrands.length ? (
            availableBrands.map((brand) => (
              <ToggleChip
                key={brand}
                active={(values.supportedBrands || []).includes(brand)}
                onClick={() => onToggle("supportedBrands", brand)}
              >
                {brand}
              </ToggleChip>
            ))
          ) : (
            <p className="text-sm text-white/50">Choose at least one vehicle type to unlock brand filters.</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Preferred Models</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableModels.length ? (
            availableModels.map((model) => (
              <ToggleChip
                key={model}
                active={(values.supportedModels || []).includes(model)}
                onClick={() => onToggle("supportedModels", model)}
              >
                {model}
              </ToggleChip>
            ))
          ) : (
            <p className="text-sm text-white/50">Model selection stays optional until a compatible brand is chosen.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParkingVehicleSupportEditor;
