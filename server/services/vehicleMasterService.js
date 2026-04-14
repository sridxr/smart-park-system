const VehicleMaster = require("../models/VehicleMaster");

const VEHICLE_MASTER_SEED = [
  { type: "car", brand: "Toyota", model: "Innova", vehicleSize: "large" },
  { type: "suv", brand: "Toyota", model: "Fortuner", vehicleSize: "large" },
  { type: "car", brand: "Hyundai", model: "i20", vehicleSize: "small" },
  { type: "suv", brand: "Hyundai", model: "Creta", vehicleSize: "large" },
  { type: "car", brand: "Honda", model: "City", vehicleSize: "medium" },
  { type: "car", brand: "Honda", model: "Amaze", vehicleSize: "medium" },
  { type: "bike", brand: "Yamaha", model: "R15", vehicleSize: "small" },
  { type: "bike", brand: "Royal Enfield", model: "Classic 350", vehicleSize: "medium" },
  { type: "ev", brand: "Tata", model: "Nexon EV", vehicleSize: "medium" },
  { type: "ev", brand: "MG", model: "ZS EV", vehicleSize: "large" },
];

const MODEL_SIZE_OVERRIDES = new Map(
  VEHICLE_MASTER_SEED.map((item) => [item.model.toLowerCase(), item.vehicleSize])
);

function normalizeVehicleType(value = "") {
  const normalized = String(value || "").trim().toLowerCase();

  if (["hatchback", "sedan", "car"].includes(normalized)) {
    return "car";
  }

  if (["suv", "bike", "ev"].includes(normalized)) {
    return normalized;
  }

  return normalized || "";
}

function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function inferVehicleSize({ type = "", model = "" } = {}) {
  const normalizedType = normalizeVehicleType(type);
  const modelKey = normalizeText(model);

  if (MODEL_SIZE_OVERRIDES.has(modelKey)) {
    return MODEL_SIZE_OVERRIDES.get(modelKey);
  }

  if (normalizedType === "bike") {
    return "small";
  }

  if (normalizedType === "suv") {
    return "large";
  }

  if (normalizedType === "ev") {
    return "medium";
  }

  return "medium";
}

async function ensureVehicleMasterCatalog() {
  await VehicleMaster.bulkWrite(
    VEHICLE_MASTER_SEED.map((item) => ({
      updateOne: {
        filter: {
          type: item.type,
          brand: item.brand,
          model: item.model,
        },
        update: { $set: item },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

async function listVehicleMaster({ type = "", brand = "" } = {}) {
  await ensureVehicleMasterCatalog();

  const query = {};
  if (type) {
    query.type = normalizeVehicleType(type);
  }
  if (brand) {
    query.brand = brand;
  }

  return VehicleMaster.find(query).sort({ type: 1, brand: 1, model: 1 }).lean();
}

function buildVehicleOptionPayload(rows = []) {
  const types = [...new Set(rows.map((row) => row.type).filter(Boolean))];
  const brandsByType = {};
  const modelsByTypeBrand = {};

  rows.forEach((row) => {
    if (!brandsByType[row.type]) {
      brandsByType[row.type] = [];
    }

    if (!brandsByType[row.type].includes(row.brand)) {
      brandsByType[row.type].push(row.brand);
    }

    const key = `${row.type}:${row.brand}`;
    if (!modelsByTypeBrand[key]) {
      modelsByTypeBrand[key] = [];
    }

    if (!modelsByTypeBrand[key].includes(row.model)) {
      modelsByTypeBrand[key].push(row.model);
    }
  });

  return {
    rows,
    types,
    brandsByType,
    modelsByTypeBrand,
  };
}

module.exports = {
  VEHICLE_MASTER_SEED,
  buildVehicleOptionPayload,
  ensureVehicleMasterCatalog,
  inferVehicleSize,
  listVehicleMaster,
  normalizeText,
  normalizeVehicleType,
};
