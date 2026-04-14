const Parking = require("../../models/parking");
const { buildTrafficAwareRecommendations } = require("./trafficRecommendationService");
const { buildDecisionProfile } = require("./decisionProfileService");
const {
  buildAreaIntelligence,
  buildComparisonStack,
  buildTimeValueOptimizer,
  computeConfidence,
  computeStress,
  rankByStrategy,
} = require("./decisionIntelligenceUtils");

function getModeLabel(mode) {
  if (mode === "fastest") {
    return "Fastest";
  }
  if (mode === "cheapest") {
    return "Cheapest";
  }
  return "Smart Balance";
}

async function buildDecisionReplay({
  userId,
  parkingId,
  userLocation = null,
  carType = "sedan",
  maxPrice = Number.MAX_SAFE_INTEGER,
  maxDistance = Number.MAX_SAFE_INTEGER,
  mode = "balanced",
}) {
  const [parkings, profile] = await Promise.all([
    Parking.find({ isActive: true }).lean(),
    buildDecisionProfile(userId),
  ]);
  const payload = await buildTrafficAwareRecommendations({
    parkings,
    userLocation,
    carType,
    maxPrice,
    maxDistance,
    preferredAreas: profile.preferredAreas || [],
  });
  const ranked = rankByStrategy(payload.recommendations || [], mode, profile);
  const targetParking =
    ranked.find((parking) => parking._id.toString() === String(parkingId || "")) || ranked[0] || null;

  if (!targetParking) {
    return {
      replaySteps: [],
      confidence: 0,
      confidenceMessage: "No recommendation available right now.",
      comparisonStack: [],
      areaIntelligence: buildAreaIntelligence([], ""),
      stress: { score: 0, level: "Low" },
      timeValueOptimizer: "No comparison available.",
    };
  }

  const confidence = computeConfidence(targetParking, profile);
  const stress = computeStress(targetParking);
  const cheapestCandidate = [...ranked].sort(
    (left, right) => Number(left.dynamicPrice || left.fare || 0) - Number(right.dynamicPrice || right.fare || 0)
  )[0];

  return {
    targetParking: {
      parkingId: targetParking._id,
      title: targetParking.title,
      score: targetParking.ai?.strategyScore || targetParking.ai?.recommendationScore || 0,
      eta: targetParking.ai?.traffic?.eta || "Live",
      trafficDelay: targetParking.ai?.traffic?.trafficDelay || "+0 min",
    },
    strategyMode: mode,
    strategyLabel: getModeLabel(mode),
    confidence,
    confidenceMessage:
      confidence >= 85
        ? "Best Parking Found"
        : confidence < 70
          ? "Multiple good options available"
          : "Strong recommendation with a few trade-offs",
    replaySteps: [
      {
        step: "Step 1",
        title: "Checked distance and walking effort",
        detail: `${targetParking.title} is about ${targetParking.ai?.distanceKm ?? "nearby"} km away, matching your ${profile.walkingTolerance} walk preference.`,
      },
      {
        step: "Step 2",
        title: "Compared live price",
        detail: `Live rate is Rs. ${targetParking.dynamicPrice || targetParking.fare || 0}, balanced against your price preference.`,
      },
      {
        step: "Step 3",
        title: "Evaluated traffic and route quality",
        detail: `ETA is ${targetParking.ai?.traffic?.eta || "updating"} with ${targetParking.ai?.traffic?.trafficDelay || "+0 min"} delay and ${targetParking.ai?.traffic?.routeQuality || "balanced"} route quality.`,
      },
      {
        step: "Step 4",
        title: "Measured availability and demand",
        detail: `${targetParking.availableSlots || 0}/${targetParking.totalSlots || 0} slots are open with ${targetParking.ai?.demandLevel || targetParking.demandLevel || "Low"} demand pressure.`,
      },
      {
        step: "Step 5",
        title: "Applied your decision profile",
        detail: `${profile.summary} Strategy mode is ${getModeLabel(mode)}.`,
      },
      {
        step: "Step 6",
        title: "Selected the optimal outcome",
        detail: `Final strategy score is ${targetParking.ai?.strategyScore || targetParking.ai?.recommendationScore || 0}/100 with ${confidence}% confidence.`,
      },
    ],
    explanation: targetParking.ai?.explanation || "Balanced decision logic selected this parking.",
    comparisonStack: buildComparisonStack(ranked.slice(0, 8)),
    areaIntelligence: buildAreaIntelligence(ranked, targetParking.address?.area || ""),
    stress,
    timeValueOptimizer: buildTimeValueOptimizer(targetParking, cheapestCandidate && cheapestCandidate._id.toString() !== targetParking._id.toString() ? cheapestCandidate : ranked[1]),
  };
}

module.exports = {
  buildDecisionReplay,
};
