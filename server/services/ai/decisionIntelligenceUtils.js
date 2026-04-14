function clampScore(score = 0) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getTrafficDelayMinutes(parking) {
  return Number(parking?.ai?.traffic?.trafficDelayMinutes || 0);
}

function getEtaMinutes(parking) {
  return Number(parking?.ai?.traffic?.etaMinutes || 0);
}

function getPrice(parking) {
  return Number(parking?.dynamicPrice || parking?.pricePerHour || parking?.fare || 0);
}

function getDistanceKm(parking) {
  return Number(parking?.ai?.distanceKm || 0);
}

function getAvailabilityRatio(parking) {
  const totalSlots = Number(parking?.totalSlots || 0);
  const availableSlots = Number(parking?.availableSlots || 0);

  if (!totalSlots) {
    return 0;
  }

  return availableSlots / totalSlots;
}

function buildStrategyWeights(mode = "balanced", profile = {}) {
  if (mode === "fastest") {
    return {
      distance: 0.24,
      price: 0.12,
      availability: 0.18,
      traffic: 0.28,
      preference: profile.prefersFast ? 0.18 : 0.12,
    };
  }

  if (mode === "cheapest") {
    return {
      distance: 0.12,
      price: 0.32,
      availability: 0.16,
      traffic: 0.14,
      preference: profile.prefersCheap ? 0.26 : 0.16,
    };
  }

  return {
    distance: 0.2,
    price: 0.2,
    availability: 0.2,
    traffic: 0.2,
    preference: 0.2,
  };
}

function computePreferenceBoost(parking, profile = {}) {
  let boost = 0;

  if (profile.prefersCheap) {
    boost += Math.max(0, 100 - getPrice(parking) / 4) * 0.35;
  }

  if (profile.prefersFast) {
    boost += Math.max(0, 100 - getEtaMinutes(parking) * 5) * 0.35;
  }

  if (profile.avoidsTraffic) {
    boost += Math.max(0, 100 - getTrafficDelayMinutes(parking) * 14) * 0.2;
  }

  if ((profile.preferredAreas || []).includes(parking?.address?.area || parking?.location?.area || "")) {
    boost += 18;
  }

  if (profile.walkingTolerance === "short") {
    boost += Math.max(0, 100 - getDistanceKm(parking) * 18) * 0.1;
  } else if (profile.walkingTolerance === "long") {
    boost += 10;
  }

  return clampScore(boost);
}

function computeStrategyScore(parking, mode = "balanced", profile = {}) {
  const weights = buildStrategyWeights(mode, profile);
  const distanceScore = Number(parking?.ai?.distanceScore || 0);
  const priceScore = Number(parking?.ai?.priceScore || 0);
  const availabilityScore = Number(parking?.ai?.availabilityScore || 0);
  const trafficScore = clampScore(
    100 - getTrafficDelayMinutes(parking) * 12 - Math.max(0, getEtaMinutes(parking) - 6) * 4
  );
  const preferenceScore = computePreferenceBoost(parking, profile);

  return clampScore(
    distanceScore * weights.distance +
      priceScore * weights.price +
      availabilityScore * weights.availability +
      trafficScore * weights.traffic +
      preferenceScore * weights.preference
  );
}

function rankByStrategy(recommendations = [], mode = "balanced", profile = {}) {
  return [...recommendations]
    .map((parking) => ({
      ...parking,
      ai: {
        ...parking.ai,
        strategyMode: mode,
        strategyScore: computeStrategyScore(parking, mode, profile),
      },
    }))
    .sort((left, right) => (right.ai?.strategyScore || 0) - (left.ai?.strategyScore || 0));
}

function computeConfidence(parking, profile = {}) {
  const baseScore = Number(parking?.ai?.strategyScore || parking?.ai?.recommendationScore || 0);
  const hasTraffic = parking?.ai?.traffic?.enabled ? 8 : 0;
  const availabilityBoost = getAvailabilityRatio(parking) >= 0.3 ? 8 : 0;
  const preferenceBoost = computePreferenceBoost(parking, profile) >= 55 ? 6 : 0;

  return clampScore(baseScore * 0.72 + hasTraffic + availabilityBoost + preferenceBoost);
}

function computeStress(parking) {
  const trafficPressure = getTrafficDelayMinutes(parking) * 9;
  const demandPressure = parking?.ai?.demandLevel === "High" ? 30 : parking?.ai?.demandLevel === "Medium" ? 16 : 8;
  const availabilityPressure = getAvailabilityRatio(parking) < 0.15 ? 28 : getAvailabilityRatio(parking) < 0.3 ? 14 : 4;
  const exitPressure = 100 - Number(parking?.ai?.fastestExitScore || 60);
  const score = clampScore(trafficPressure + demandPressure + availabilityPressure + exitPressure * 0.18);

  return {
    score,
    level: score >= 70 ? "High" : score >= 42 ? "Medium" : "Low",
  };
}

function buildAreaIntelligence(parkings = [], area = "") {
  const scoped = parkings.filter((parking) => {
    const parkingArea = parking?.address?.area || parking?.location?.area || "";
    return area ? parkingArea === area : true;
  });

  if (!scoped.length) {
    return {
      trafficLevel: "Moderate",
      demandLevel: "Stable",
      averagePrice: 0,
      bestTimeToPark: "Now",
    };
  }

  const averageTrafficDelay =
    scoped.reduce((sum, parking) => sum + getTrafficDelayMinutes(parking), 0) / scoped.length;
  const averageAvailability =
    scoped.reduce((sum, parking) => sum + getAvailabilityRatio(parking), 0) / scoped.length;
  const averagePrice = Math.round(scoped.reduce((sum, parking) => sum + getPrice(parking), 0) / scoped.length);

  return {
    trafficLevel: averageTrafficDelay >= 6 ? "High" : averageTrafficDelay >= 3 ? "Moderate" : "Low",
    demandLevel: averageAvailability <= 0.2 ? "High" : averageAvailability <= 0.4 ? "Medium" : "Low",
    averagePrice,
    bestTimeToPark: averageTrafficDelay >= 5 ? "30-45 mins later" : "Now",
  };
}

function buildComparisonStack(recommendations = []) {
  if (!recommendations.length) {
    return [];
  }

  const bestChoice = [...recommendations].sort(
    (left, right) => (right.ai?.strategyScore || right.ai?.recommendationScore || 0) - (left.ai?.strategyScore || left.ai?.recommendationScore || 0)
  )[0];
  const cheapest = [...recommendations].sort((left, right) => getPrice(left) - getPrice(right))[0];
  const fastest = [...recommendations].sort((left, right) => getEtaMinutes(left) - getEtaMinutes(right))[0];
  const closest = [...recommendations].sort((left, right) => getDistanceKm(left) - getDistanceKm(right))[0];

  const variants = [
    { label: "Best Choice", icon: "rocket", parking: bestChoice },
    { label: "Cheapest", icon: "wallet", parking: cheapest },
    { label: "Fastest", icon: "zap", parking: fastest },
    { label: "Closest", icon: "map-pin", parking: closest },
  ];

  return variants.map(({ label, icon, parking }) => ({
    label,
    icon,
    parkingId: parking?._id?.toString() || "",
    title: parking?.title || "",
    score: parking?.ai?.strategyScore || parking?.ai?.recommendationScore || 0,
    price: getPrice(parking),
    distanceKm: getDistanceKm(parking),
    etaMinutes: getEtaMinutes(parking),
    routeQuality: parking?.ai?.traffic?.routeQuality || "Unknown",
  }));
}

function buildTimeValueOptimizer(primaryParking, alternateParking) {
  if (!primaryParking || !alternateParking) {
    return "Time and price trade-offs will appear once multiple strong options are available.";
  }

  const priceDiff = Math.round(getPrice(alternateParking) - getPrice(primaryParking));
  const etaDiff = Math.round(getEtaMinutes(alternateParking) - getEtaMinutes(primaryParking));

  if (priceDiff < 0 && etaDiff > 0) {
    return `Save Rs. ${Math.abs(priceDiff)} but add about ${etaDiff} minutes of travel.`;
  }

  if (priceDiff > 0 && etaDiff < 0) {
    return `Pay Rs. ${priceDiff} more to save about ${Math.abs(etaDiff)} minutes.`;
  }

  if (priceDiff < 0) {
    return `Save around Rs. ${Math.abs(priceDiff)} with almost the same arrival time.`;
  }

  if (etaDiff < 0) {
    return `Save about ${Math.abs(etaDiff)} minutes with nearly the same price.`;
  }

  return "Current top options are closely matched on price and time.";
}

module.exports = {
  buildAreaIntelligence,
  buildComparisonStack,
  buildStrategyWeights,
  buildTimeValueOptimizer,
  clampScore,
  computeConfidence,
  computeStress,
  computeStrategyScore,
  rankByStrategy,
};
