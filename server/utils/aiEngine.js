const {
  filterRankedResultsByVehicleCompatibility,
  getParkingVehicleCompatibility,
} = require("../services/ai/vehicleCompatibilityService");

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getDistanceKm(origin, destination) {
  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(deltaLng / 2) ** 2;

  return Number((2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

function getTimeFactor(currentDate = new Date()) {
  const hour = currentDate.getHours();

  if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)) {
    return 35;
  }

  if (hour >= 12 && hour <= 16) {
    return 15;
  }

  if (hour >= 22 || hour <= 5) {
    return -12;
  }

  return 0;
}

function predictDemandLevel({ totalSlots = 0, availableSlots = 0, recentBookings = 0 }) {
  if (!totalSlots) {
    return "Low";
  }

  const occupancyRate = ((totalSlots - availableSlots) / totalSlots) * 100;

  if (occupancyRate >= 80 || recentBookings >= 10) {
    return "High";
  }

  if (occupancyRate >= 45 || recentBookings >= 4) {
    return "Medium";
  }

  return "Low";
}

function getDemandScore({ totalSlots = 0, availableSlots = 0, recentBookings = 0 }) {
  if (!totalSlots) {
    return 0;
  }

  const occupancyRate = ((totalSlots - availableSlots) / totalSlots) * 100;
  return clampScore(occupancyRate * 0.7 + recentBookings * 4);
}

function getCarFit({ parkingSize = "medium", carType = "sedan", vehicleSize = "" }) {
  const parkingRank = { small: 1, medium: 2, large: 3 };
  const carRank = { hatchback: 1, sedan: 2, car: 2, ev: 2, bike: 1, suv: 3 };
  const slot = parkingRank[parkingSize] || 2;
  const car = parkingRank[vehicleSize] || carRank[carType] || 2;

  if (slot - car >= 1) {
    return "Perfect";
  }

  if (slot === car) {
    return "Tight";
  }

  return "Not Suitable";
}

function getHeatmapColor(demandScore = 0) {
  if (demandScore >= 75) {
    return "#ef4444";
  }

  if (demandScore >= 45) {
    return "#f59e0b";
  }

  return "#22c55e";
}

function getDemandFactor({
  demandLevel = "Low",
  occupancyRate = 0,
  recentBookings = 0,
}) {
  const occupancyFactor = Math.round((occupancyRate / 100) * 40);
  const bookingVelocityFactor = Math.min(20, recentBookings * 2);
  const levelFactor =
    demandLevel === "High" ? 25 : demandLevel === "Medium" ? 10 : -8;

  return occupancyFactor + bookingVelocityFactor + levelFactor;
}

function getDynamicPricingSuggestion({
  baseFare = 0,
  demandLevel = "Low",
  occupancyRate = 0,
  recentBookings = 0,
  currentDate = new Date(),
}) {
  const demandFactor = getDemandFactor({
    demandLevel,
    occupancyRate,
    recentBookings,
  });
  const timeFactor = getTimeFactor(currentDate);
  const suggestion = Math.max(
    50,
    Math.round(Number(baseFare || 0) + demandFactor + timeFactor)
  );

  let insight = "Balanced demand window. Current pricing is aligned with supply.";
  if (suggestion > baseFare) {
    insight = "High demand or peak-hour pressure detected. A higher price should improve yield.";
  } else if (suggestion < baseFare) {
    insight = "Low demand window detected. A softer price can improve occupancy.";
  }

  return {
    suggestion,
    demandFactor,
    timeFactor,
    insight,
  };
}

function getPredictiveAvailability({ availableSlots = 0, recentBookings = 0 }) {
  if (availableSlots <= 0) {
    return "Already full";
  }

  if (recentBookings >= availableSlots) {
    return "Likely to be full in 20 minutes";
  }

  if (availableSlots <= 2) {
    return "Only a few slots may remain soon";
  }

  return "Stable availability for the next 20 minutes";
}

function getRecommendationTags({
  price,
  averagePrice,
  availabilityRatio,
  demandLevel,
  distanceKm,
  fastestExitScore,
}) {
  const tags = [];

  if (price <= averagePrice) {
    tags.push("Cheapest");
  }

  if (availabilityRatio >= 0.65) {
    tags.push("Best Choice");
  }

  if (demandLevel === "High") {
    tags.push("Trending");
  }

  if (distanceKm !== null && distanceKm <= 1.5) {
    tags.push("Fastest Access");
  }

  if (fastestExitScore >= 78) {
    tags.push("Fastest Exit");
  }

  return tags;
}

function generateExplanation({
  price,
  averagePrice,
  availabilityRatio,
  demandLevel,
  distanceKm,
  carFit,
  fastestExitScore,
  vehicleCompatibility,
}) {
  const reasons = [];

  if (price <= averagePrice) {
    reasons.push("lower price");
  }

  if (availabilityRatio >= 0.65) {
    reasons.push("high availability");
  }

  if (distanceKm !== null && distanceKm <= 2) {
    reasons.push("short travel distance");
  }

  if (carFit === "Perfect") {
    reasons.push("excellent fit for your vehicle");
  }

  if (demandLevel === "Low") {
    reasons.push("low crowd pressure");
  }

  if (fastestExitScore >= 78) {
    reasons.push("fast exit path");
  }

  if (vehicleCompatibility?.strictMatch) {
    reasons.push("strong vehicle compatibility");
  } else if (vehicleCompatibility?.typeMatch) {
    reasons.push("vehicle-type support");
  }

  if (reasons.length === 0) {
    return "Recommended based on balanced price, fit, and current live availability.";
  }

  return `Recommended due to ${reasons.slice(0, 3).join(", ")}.`;
}

function analyzePeakHours(bookings = []) {
  const hourCounts = new Map();

  bookings.forEach((booking) => {
    const hour = new Date(booking.createdAt).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  return [...hourCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => hour);
}

function scoreParking(parking, preferences = {}, averagePrice = 0) {
  const {
    userLocation,
    carType = "sedan",
    maxPrice = Infinity,
    maxDistance = Infinity,
    preferredAreas = [],
    vehicleProfile = null,
  } = preferences;
  const totalSlots = parking.totalSlots || parking.availableSlots || 1;
  const availabilityRatio = (parking.availableSlots || 0) / totalSlots;
  const occupancyRate = ((totalSlots - (parking.availableSlots || 0)) / totalSlots) * 100;
  const distanceKm = getDistanceKm(userLocation, parking.location);
  const demandLevel = predictDemandLevel({
    totalSlots,
    availableSlots: parking.availableSlots || 0,
    recentBookings: parking.liveMetrics?.recentBookings || 0,
  });
  const demandScore = getDemandScore({
    totalSlots,
    availableSlots: parking.availableSlots || 0,
    recentBookings: parking.liveMetrics?.recentBookings || 0,
  });
  const compatibility = getParkingVehicleCompatibility(parking, vehicleProfile);
  const carFit = getCarFit({
    parkingSize: parking.parkingSize,
    carType,
    vehicleSize: vehicleProfile?.vehicleSize,
  });
  const ratingScore = clampScore(((parking.rating || 4) / 5) * 100);
  const priceScore = averagePrice
    ? clampScore(100 - (((parking.fare || 0) - averagePrice) / averagePrice) * 40)
    : 70;
  const distanceScore =
    distanceKm === null ? 60 : clampScore(100 - Math.max(0, distanceKm * 18));
  const availabilityScore = clampScore(availabilityRatio * 100);
  const exitEaseScore = clampScore(parking.exitProfile?.easeScore || 70);
  const preferenceScore = preferredAreas.includes(parking.address?.area) ? 12 : 0;
  const pricingPreview = getDynamicPricingSuggestion({
    baseFare: parking.fare,
    demandLevel,
    occupancyRate,
    recentBookings: parking.liveMetrics?.recentBookings || 0,
  });

  let recommendationScore =
    priceScore * 0.24 +
    distanceScore * 0.28 +
    availabilityScore * 0.24 +
    ratingScore * 0.12 +
    exitEaseScore * 0.12 +
    preferenceScore +
    (compatibility.scoreModifier || 0);

  if ((parking.fare || 0) > maxPrice) {
    recommendationScore -= 18;
  }

  if (distanceKm !== null && distanceKm > maxDistance) {
    recommendationScore -= 18;
  }

  if (carFit === "Perfect") recommendationScore += 10;
  if (carFit === "Tight") recommendationScore += 4;
  if (carFit === "Not Suitable") recommendationScore -= 28;

  const fastestExitScore = clampScore(exitEaseScore * 0.7 + distanceScore * 0.3);

  return {
    recommendationScore: clampScore(recommendationScore),
    demandLevel,
    demandScore,
    heatmapIntensity: demandScore,
    heatmapColor: getHeatmapColor(demandScore),
    carFit,
    distanceKm,
    distanceScore,
    availabilityScore,
    priceScore,
    ratingScore,
    fastestExitScore,
    personalized: preferenceScore > 0,
    explanation: generateExplanation({
      price: parking.fare,
      averagePrice,
      availabilityRatio,
      demandLevel,
      distanceKm,
      carFit,
      fastestExitScore,
      vehicleCompatibility: compatibility,
    }),
    predictiveAvailability: getPredictiveAvailability({
      availableSlots: parking.availableSlots,
      recentBookings: parking.liveMetrics?.recentBookings || 0,
    }),
    dynamicPricing: pricingPreview,
    recommendationTags: getRecommendationTags({
      price: parking.fare,
      averagePrice,
      availabilityRatio,
      demandLevel,
      distanceKm,
      fastestExitScore,
    }),
    vehicleCompatibility: compatibility,
  };
}

function enrichParkingResults(parkings = [], preferences = {}) {
  if (parkings.length === 0) {
    return [];
  }

  const averagePrice =
    parkings.reduce((sum, parking) => sum + (parking.fare || 0), 0) / parkings.length;

  const ranked = parkings
    .map((parking) => ({
      ...parking,
      ai: scoreParking(parking, preferences, averagePrice),
    }))
    .sort((a, b) => b.ai.recommendationScore - a.ai.recommendationScore);

  if (preferences.vehicleProfile?.type) {
    return filterRankedResultsByVehicleCompatibility(ranked);
  }

  return ranked;
}

module.exports = {
  analyzePeakHours,
  enrichParkingResults,
  generateExplanation,
  getCarFit,
  getDemandFactor,
  getDemandScore,
  getDistanceKm,
  getDynamicPricingSuggestion,
  getHeatmapColor,
  getPredictiveAvailability,
  getTimeFactor,
  predictDemandLevel,
  scoreParking,
};
