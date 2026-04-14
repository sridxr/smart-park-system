const { getDistanceKm } = require("../../utils/aiEngine");

function detectArrival(userLocation, parkingLocation, thresholdMeters = 50) {
  const distanceKm = getDistanceKm(userLocation, parkingLocation);

  if (distanceKm === null) {
    return {
      arrived: false,
      distanceMeters: null,
    };
  }

  const distanceMeters = Math.round(distanceKm * 1000);

  return {
    arrived: distanceMeters <= thresholdMeters,
    distanceMeters,
  };
}

module.exports = {
  detectArrival,
};
