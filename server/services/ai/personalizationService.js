const Parking = require("../../models/parking");
const { getBehaviorSnapshot } = require("../behaviorTrackingService");
const { enrichParkingResults } = require("../../utils/aiEngine");

function isPriceAligned(price, preferredPriceRange) {
  if (!preferredPriceRange?.max) {
    return true;
  }
  return price >= Math.max(0, preferredPriceRange.min - 100) && price <= preferredPriceRange.max + 100;
}

async function buildPersonalizationPayload({
  userId,
  userLocation = null,
  carType = "sedan",
  maxPrice = Number.MAX_SAFE_INTEGER,
  vehicleProfile = null,
}) {
  const [behavior, parkings] = await Promise.all([
    getBehaviorSnapshot(userId),
    Parking.find({ isActive: true }).lean(),
  ]);

  const preferredLocations = behavior.preferredLocations || [];
  const preferredPriceRange = behavior.preferredPriceRange || { min: 0, max: 0 };
  const enriched = enrichParkingResults(parkings, {
    userLocation,
    carType,
    maxPrice,
    preferredAreas: preferredLocations,
    vehicleProfile,
  });

  const recommendations = enriched
    .filter((parking) =>
      preferredLocations.length
        ? preferredLocations.includes(parking.address?.area || "") || isPriceAligned(Number(parking.dynamicPrice || parking.fare), preferredPriceRange)
        : true
    )
    .slice(0, 4);

  return {
    preferredLocations,
    preferredPriceRange,
    bookingTimePatterns: (behavior.bookingHourHistogram || [])
      .map((count, hour) => ({ hour, count }))
      .filter((entry) => entry.count > 0)
      .sort((left, right) => right.count - left.count)
      .slice(0, 4),
    recommendations,
    summary: preferredLocations.length
      ? `Recommendations are now tuned around ${preferredLocations.join(", ")}.`
      : "Explore more locations to unlock stronger personalized recommendations.",
  };
}

module.exports = {
  buildPersonalizationPayload,
};
