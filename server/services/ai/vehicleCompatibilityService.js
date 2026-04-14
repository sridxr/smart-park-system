const {
  inferVehicleSize,
  normalizeText,
  normalizeVehicleType,
} = require("../vehicleMasterService");

function normalizeList(values = []) {
  return Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
}

function normalizeSupportedTypes(parking = {}) {
  const explicitTypes = normalizeList(parking.supportedVehicleTypes).map(normalizeVehicleType);
  if (explicitTypes.length) {
    return [...new Set(explicitTypes)];
  }

  return [
    ...new Set(
      normalizeList(parking.allowedCars).map(normalizeVehicleType).filter(Boolean)
    ),
  ];
}

function getVehicleProfile(source = {}) {
  const type = normalizeVehicleType(source.type || source.vehicleType || source.carType || "");
  const brand = String(source.brand || "").trim();
  const model = String(source.model || "").trim();
  const vehicleSize = source.vehicleSize || inferVehicleSize({ type, model });

  if (!type && !brand && !model) {
    return null;
  }

  return {
    type,
    brand,
    model,
    vehicleSize,
    label: source.label || [brand, model].filter(Boolean).join(" ") || type,
    displayName: [brand, model].filter(Boolean).join(" ") || type || "selected vehicle",
  };
}

function getPhysicalFit(parkingSize = "medium", vehicleSize = "medium") {
  const sizeRank = {
    small: 1,
    medium: 2,
    large: 3,
  };

  return (sizeRank[parkingSize] || 2) >= (sizeRank[vehicleSize] || 2);
}

function buildCompatibilityResult({
  applies = false,
  compatible = true,
  strictMatch = true,
  typeMatch = true,
  label = "",
  summary = "",
  scoreModifier = 0,
  status = "open",
}) {
  return {
    applies,
    compatible,
    strictMatch,
    typeMatch,
    label,
    summary,
    scoreModifier,
    status,
  };
}

function getParkingVehicleCompatibility(parking = {}, vehicleProfile = null) {
  if (!vehicleProfile?.type) {
    return buildCompatibilityResult({
      label: "Compatibility open",
      summary: "No exact vehicle selected. Vehicle-aware filtering is currently relaxed.",
      status: "open",
    });
  }

  const supportedTypes = normalizeSupportedTypes(parking);
  const supportedBrands = normalizeList(parking.supportedBrands);
  const supportedModels = normalizeList(parking.supportedModels);
  const supportedSizes = normalizeList(parking.supportedVehicleSizes);
  const brandRestricted = supportedBrands.length > 0;
  const modelRestricted = supportedModels.length > 0;
  const sizeRestricted = supportedSizes.length > 0;

  const typeMatch = !supportedTypes.length || supportedTypes.includes(vehicleProfile.type);
  const brandMatch =
    !brandRestricted ||
    supportedBrands.some((item) => normalizeText(item) === normalizeText(vehicleProfile.brand));
  const modelMatch =
    !modelRestricted ||
    supportedModels.some((item) => normalizeText(item) === normalizeText(vehicleProfile.model));
  const sizeMatch =
    !sizeRestricted ||
    supportedSizes.some((item) => normalizeText(item) === normalizeText(vehicleProfile.vehicleSize));
  const physicalFit = getPhysicalFit(parking.parkingSize, vehicleProfile.vehicleSize);

  const strictMatch = typeMatch && brandMatch && modelMatch && sizeMatch && physicalFit;
  const typeOnlyMatch = typeMatch && physicalFit;

  if (strictMatch) {
    return buildCompatibilityResult({
      applies: true,
      compatible: true,
      strictMatch: true,
      typeMatch: true,
      label: `Suitable for: ${vehicleProfile.displayName}`,
      summary: `${vehicleProfile.displayName} matches this parking's declared support.`,
      scoreModifier: 14,
      status: "strong",
    });
  }

  if (typeOnlyMatch) {
    return buildCompatibilityResult({
      applies: true,
      compatible: true,
      strictMatch: false,
      typeMatch: true,
      label: "Limited compatibility",
      summary: `Type support is available for ${vehicleProfile.type}, but the exact brand/model is not explicitly listed.`,
      scoreModifier: 5,
      status: "limited",
    });
  }

  return buildCompatibilityResult({
    applies: true,
    compatible: false,
    strictMatch: false,
    typeMatch: false,
    label: "Limited compatibility",
    summary: `${vehicleProfile.displayName} may not be an ideal match for this parking.`,
    scoreModifier: -40,
    status: "warning",
  });
}

function filterRankedResultsByVehicleCompatibility(rows = []) {
  const strictMatches = rows.filter((row) => row.ai?.vehicleCompatibility?.strictMatch);
  if (strictMatches.length) {
    return strictMatches;
  }

  const typeMatches = rows.filter((row) => row.ai?.vehicleCompatibility?.typeMatch);
  if (typeMatches.length) {
    return typeMatches;
  }

  return rows;
}

module.exports = {
  filterRankedResultsByVehicleCompatibility,
  getParkingVehicleCompatibility,
  getVehicleProfile,
};
