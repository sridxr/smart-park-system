const Vehicle = require("../models/Vehicle");
const {
  buildVehicleOptionPayload,
  inferVehicleSize,
  listVehicleMaster,
  normalizeVehicleType,
} = require("../services/vehicleMasterService");

function buildVehicleDocument(body = {}) {
  const type = normalizeVehicleType(body.type || body.vehicleType || "car") || "car";
  const brand = String(body.brand || "").trim();
  const model = String(body.model || "").trim();
  const vehicleSize = body.vehicleSize || inferVehicleSize({ type, model });

  return {
    label: String(body.label || [brand, model].filter(Boolean).join(" ") || type).trim(),
    type,
    vehicleType: type,
    brand,
    model,
    vehicleSize,
    number: String(body.number || "").trim(),
    isDefault: Boolean(body.isDefault),
  };
}

async function listVehicles(req, res) {
  const vehicles = await Vehicle.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json(vehicles);
}

async function createVehicle(req, res) {
  const payload = buildVehicleDocument(req.body);

  if (!payload.number) {
    return res.status(400).json({ msg: "Vehicle number is required" });
  }

  if (req.body.isDefault) {
    await Vehicle.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const vehicle = await Vehicle.create({
    user: req.user._id,
    ...payload,
  });

  res.status(201).json(vehicle);
}

async function removeVehicle(req, res) {
  await Vehicle.findOneAndDelete({ _id: req.params.vehicleId, user: req.user._id });
  res.status(204).end();
}

async function listVehicleMasterCatalog(req, res) {
  const rows = await listVehicleMaster({
    type: req.query.type,
    brand: req.query.brand,
  });

  res.json(buildVehicleOptionPayload(rows));
}

async function listLenderVehicleSupport(req, res) {
  const rows = await listVehicleMaster();
  res.json(buildVehicleOptionPayload(rows));
}

module.exports = {
  createVehicle,
  listLenderVehicleSupport,
  listVehicleMasterCatalog,
  listVehicles,
  removeVehicle,
};
