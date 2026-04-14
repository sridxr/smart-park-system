const Vehicle = require("../models/Vehicle");
const { getVehicleProfile } = require("./ai/vehicleCompatibilityService");

async function resolveVehicleSelection({ userId, vehicleId = "", fallbackVehicle = null } = {}) {
  if (vehicleId) {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: userId }).lean();
    if (vehicle) {
      const profile = getVehicleProfile(vehicle);

      return {
        vehicleId: vehicle._id,
        label: vehicle.label || profile?.displayName || "",
        type: vehicle.type || profile?.type || "",
        vehicleType: vehicle.vehicleType || vehicle.type || profile?.type || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        vehicleSize: vehicle.vehicleSize || profile?.vehicleSize || "",
        number: vehicle.number || "",
      };
    }
  }

  const profile = getVehicleProfile(fallbackVehicle || {});
  if (!profile) {
    return null;
  }

  return {
    vehicleId: null,
    label: fallbackVehicle?.label || profile.displayName,
    type: profile.type,
    vehicleType: fallbackVehicle?.vehicleType || profile.type,
    brand: profile.brand,
    model: profile.model,
    vehicleSize: profile.vehicleSize,
    number: fallbackVehicle?.number || "",
  };
}

module.exports = {
  resolveVehicleSelection,
};
