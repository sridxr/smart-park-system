const Booking = require("../../models/Booking");
const Parking = require("../../models/parking");
const { buildTrafficAwareRecommendations } = require("./trafficRecommendationService");
const { buildDecisionProfile } = require("./decisionProfileService");
const {
  buildAreaIntelligence,
  buildComparisonStack,
  buildTimeValueOptimizer,
  clampScore,
  rankByStrategy,
} = require("./decisionIntelligenceUtils");

function getOffsetDate(minutesOffset = 30) {
  return new Date(Date.now() + Number(minutesOffset || 30) * 60 * 1000);
}

function getDemandMultiplier(hour, demandByHour = []) {
  const hourDemand = Number(demandByHour[hour] || 0);
  const averageDemand =
    demandByHour.reduce((sum, value) => sum + Number(value || 0), 0) / Math.max(1, demandByHour.length);

  if (!averageDemand || hourDemand >= averageDemand * 1.25) {
    return 1.12;
  }

  if (hourDemand <= averageDemand * 0.8) {
    return 0.9;
  }

  return 1;
}

function getTrafficMultiplier(hour) {
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    return 1.18;
  }

  if (hour >= 22 || hour <= 6) {
    return 0.88;
  }

  return 1;
}

function getAvailabilityAdjustment(hour) {
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    return -1;
  }

  if (hour >= 22 || hour <= 6) {
    return 2;
  }

  return 0;
}

function applyScenario(parking, { priceFactor, trafficFactor, availabilityAdjustment }) {
  const basePrice = Number(parking.dynamicPrice || parking.pricePerHour || parking.fare || 0);
  const baseEta = Number(parking.ai?.traffic?.etaMinutes || 0);
  const baseDelay = Number(parking.ai?.traffic?.trafficDelayMinutes || 0);
  const nextAvailableSlots = Math.max(0, Number(parking.availableSlots || 0) + availabilityAdjustment);
  const nextTotalSlots = Math.max(Number(parking.totalSlots || 0), 1);

  return {
    ...parking,
    availableSlots: nextAvailableSlots,
    ai: {
      ...parking.ai,
      availabilityScore: clampScore((nextAvailableSlots / nextTotalSlots) * 100),
      traffic: {
        ...parking.ai?.traffic,
        etaMinutes: Math.max(1, Math.round(baseEta * trafficFactor || 0)),
        eta: `${Math.max(1, Math.round(baseEta * trafficFactor || 0))} min`,
        trafficDelayMinutes: Math.max(0, Math.round(baseDelay * trafficFactor || 0)),
        trafficDelay: `+${Math.max(0, Math.round(baseDelay * trafficFactor || 0))} min`,
      },
    },
    dynamicPrice: Math.max(0, Math.round(basePrice * priceFactor)),
  };
}

async function runWhatIfSimulation({
  userId,
  userLocation = null,
  carType = "sedan",
  maxPrice = Number.MAX_SAFE_INTEGER,
  maxDistance = Number.MAX_SAFE_INTEGER,
  minutesOffset = 30,
  mode = "balanced",
}) {
  const [parkings, profile, recentBookings] = await Promise.all([
    Parking.find({ isActive: true }).lean(),
    buildDecisionProfile(userId),
    Booking.find({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
      .select("createdAt")
      .lean(),
  ]);

  const baseline = await buildTrafficAwareRecommendations({
    parkings,
    userLocation,
    carType,
    maxPrice,
    maxDistance,
    preferredAreas: profile.preferredAreas || [],
  });

  const rankedBaseline = rankByStrategy(baseline.recommendations || [], mode, profile);
  const demandByHour = Array.from({ length: 24 }, () => 0);
  recentBookings.forEach((booking) => {
    const hour = new Date(booking.createdAt).getHours();
    demandByHour[hour] += 1;
  });

  const scenarioDate = getOffsetDate(minutesOffset);
  const scenarioHour = scenarioDate.getHours();
  const priceFactor = getDemandMultiplier(scenarioHour, demandByHour);
  const trafficFactor = getTrafficMultiplier(scenarioHour);
  const availabilityAdjustment = getAvailabilityAdjustment(scenarioHour);

  const scenarioRanked = rankByStrategy(
    rankedBaseline.map((parking) =>
      applyScenario(parking, {
        priceFactor,
        trafficFactor,
        availabilityAdjustment,
      })
    ),
    mode,
    profile
  );

  const currentBest = rankedBaseline[0] || null;
  const futureBest = scenarioRanked[0] || null;
  const priceChange = Math.round((futureBest?.dynamicPrice || 0) - (currentBest?.dynamicPrice || 0));
  const trafficChange =
    Math.round((futureBest?.ai?.traffic?.trafficDelayMinutes || 0) - (currentBest?.ai?.traffic?.trafficDelayMinutes || 0));
  const availabilityChange =
    Math.round((futureBest?.availableSlots || 0) - (currentBest?.availableSlots || 0));
  const areaIntelligence = buildAreaIntelligence(scenarioRanked, futureBest?.address?.area || "");

  return {
    scenarioTime: scenarioDate.toISOString(),
    scenarioLabel: `If you go ${minutesOffset} minutes later`,
    baseline: currentBest
      ? {
          parkingId: currentBest._id,
          title: currentBest.title,
          price: Number(currentBest.dynamicPrice || currentBest.pricePerHour || currentBest.fare || 0),
          etaMinutes: Number(currentBest.ai?.traffic?.etaMinutes || 0),
          trafficDelayMinutes: Number(currentBest.ai?.traffic?.trafficDelayMinutes || 0),
          availableSlots: Number(currentBest.availableSlots || 0),
        }
      : null,
    scenario: futureBest
      ? {
          parkingId: futureBest._id,
          title: futureBest.title,
          price: Number(futureBest.dynamicPrice || futureBest.pricePerHour || futureBest.fare || 0),
          etaMinutes: Number(futureBest.ai?.traffic?.etaMinutes || 0),
          trafficDelayMinutes: Number(futureBest.ai?.traffic?.trafficDelayMinutes || 0),
          availableSlots: Number(futureBest.availableSlots || 0),
        }
      : null,
    priceChange,
    trafficChange,
    availabilityChange,
    summary: [
      priceChange < 0 ? "Price likely to drop" : priceChange > 0 ? "Price likely to rise" : "Price should stay stable",
      trafficChange < 0 ? "Traffic should ease" : trafficChange > 0 ? "Traffic may get heavier" : "Traffic looks stable",
      availabilityChange > 0 ? "Availability should improve" : availabilityChange < 0 ? "Availability may tighten" : "Availability should hold steady",
    ],
    explanation: futureBest
      ? `Going later shifts the balance toward ${futureBest.title} with ${
          priceChange < 0 ? "better value" : trafficChange < 0 ? "a lighter route" : "similar conditions"
        }.`
      : "Simulation could not identify a stronger parking outcome for the selected scenario.",
    areaIntelligence,
    comparisonStack: buildComparisonStack(scenarioRanked.slice(0, 8)),
    timeValueOptimizer: buildTimeValueOptimizer(currentBest, futureBest && futureBest._id !== currentBest?._id ? futureBest : scenarioRanked[1]),
  };
}

module.exports = {
  runWhatIfSimulation,
};
