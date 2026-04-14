const { enrichParkingResults } = require("../../utils/aiEngine");
const { getTrafficDataBatch } = require("../traffic/googleTrafficService");

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreTrafficWeight(trafficDelayMinutes = 0, etaMinutes = 0) {
  return clampScore(100 - trafficDelayMinutes * 12 - Math.max(0, etaMinutes - 5) * 2.5);
}

function buildTrafficExplanation(parking) {
  const reasons = [];

  if ((parking.ai?.traffic?.trafficDelayMinutes || 0) <= 2) {
    reasons.push("lowest traffic delay");
  }

  if ((parking.ai?.traffic?.etaMinutes || 0) > 0 && (parking.ai?.traffic?.etaMinutes || 0) <= 10) {
    reasons.push("fast route ETA");
  }

  if ((parking.ai?.distanceKm || 99) <= 2) {
    reasons.push("close distance");
  }

  if ((parking.availableSlots || 0) >= 3) {
    reasons.push("available slots");
  }

  if (!reasons.length) {
    return "Chosen because it balances traffic, price, and live availability.";
  }

  return `Chosen because ${reasons.slice(0, 3).join(", ")}.`;
}

function decorateTrafficAwareParking(parking, trafficData) {
  if (!trafficData) {
    return {
      ...parking,
      ai: {
        ...parking.ai,
        traffic: {
          enabled: false,
          eta: "",
          etaMinutes: null,
          trafficDelay: "+0 min",
          trafficDelayMinutes: 0,
          routeQuality: "Unknown",
          provider: "fallback",
          explanation: `${parking.ai?.explanation || "Balanced parking recommendation."} Traffic data unavailable, using standard AI scoring.`,
        },
      },
    };
  }

  const trafficDelayMinutes = Number(trafficData.trafficDelay?.valueMinutes || 0);
  const etaMinutes = Number(trafficData.trafficDuration?.valueMinutes || 0);
  const trafficWeight = scoreTrafficWeight(trafficDelayMinutes, etaMinutes);
  const userPreferenceWeight = parking.ai?.personalized ? 8 : 0;

  let recommendationScore =
    parking.ai.distanceScore * 0.2 +
    parking.ai.priceScore * 0.18 +
    parking.ai.availabilityScore * 0.2 +
    trafficWeight * 0.24 +
    parking.ai.recommendationScore * 0.18 +
    userPreferenceWeight;

  if (trafficDelayMinutes >= 6) {
    recommendationScore += (parking.ai.distanceScore || 0) > 70 ? 4 : -8;
  }

  const routeQuality = trafficData.routeQuality || "Moderate";
  const routeSummary =
    routeQuality === "Low"
      ? "Fastest route with low congestion"
      : routeQuality === "Moderate"
        ? "Balanced route with manageable traffic"
        : "Heavier traffic detected, but still strong on distance and price";

  return {
    ...parking,
    ai: {
      ...parking.ai,
      recommendationScore: clampScore(recommendationScore),
      explanation: `${parking.ai?.explanation || "Balanced parking recommendation."} ${buildTrafficExplanation({
        ...parking,
        ai: {
          ...parking.ai,
          traffic: {
            trafficDelayMinutes,
            etaMinutes,
          },
        },
      })}`,
      traffic: {
        enabled: true,
        eta: trafficData.trafficDuration?.text || "",
        etaMinutes,
        distance: trafficData.distance?.text || "",
        trafficDelay: trafficData.trafficDelay?.text || "+0 min",
        trafficDelayMinutes,
        routeQuality,
        provider: trafficData.provider,
        routeSummary,
        refreshedAt: trafficData.refreshedAt,
        duration: trafficData.duration?.text || "",
      },
    },
  };
}

async function buildTrafficAwareRecommendations({
  parkings = [],
  userLocation = null,
  carType = "sedan",
  maxPrice = Number.MAX_SAFE_INTEGER,
  maxDistance = Number.MAX_SAFE_INTEGER,
  preferredAreas = [],
  vehicleProfile = null,
}) {
  const baseRecommendations = enrichParkingResults(parkings, {
    userLocation,
    carType,
    maxPrice,
    maxDistance,
    preferredAreas,
    vehicleProfile,
  });

  if (!userLocation || !baseRecommendations.length) {
    return {
      recommendations: baseRecommendations,
      bestParking: baseRecommendations[0] || null,
      trafficEnabled: false,
      refreshedAt: new Date().toISOString(),
    };
  }

  const trafficBatch = await getTrafficDataBatch(
    userLocation,
    baseRecommendations.map((parking) => parking.location)
  );
  const recommendations = baseRecommendations
    .map((parking, index) => decorateTrafficAwareParking(parking, trafficBatch[index]))
    .sort((left, right) => (right.ai?.recommendationScore || 0) - (left.ai?.recommendationScore || 0));

  const bestParking = recommendations[0] || null;

  return {
    recommendations,
    bestParking,
    eta: bestParking?.ai?.traffic?.eta || "",
    trafficDelay: bestParking?.ai?.traffic?.trafficDelay || "+0 min",
    routeQuality: bestParking?.ai?.traffic?.routeQuality || "Unknown",
    explanation:
      bestParking?.ai?.traffic?.routeSummary ||
      bestParking?.ai?.explanation ||
      "Traffic-aware recommendation unavailable right now.",
    trafficEnabled: recommendations.some((parking) => parking.ai?.traffic?.enabled),
    refreshedAt: new Date().toISOString(),
  };
}

module.exports = {
  buildTrafficAwareRecommendations,
};
