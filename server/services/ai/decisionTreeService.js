const Parking = require("../../models/parking");
const { buildDecisionProfile } = require("./decisionProfileService");
const { buildTrafficAwareRecommendations } = require("./trafficRecommendationService");
const { rankByStrategy } = require("./decisionIntelligenceUtils");

function pickByMode(recommendations = [], mode = "balanced") {
  const ranked = rankByStrategy(recommendations, mode, {});
  return ranked[0] || null;
}

async function buildDecisionTree({
  userId,
  userLocation = null,
  carType = "sedan",
  maxPrice = Number.MAX_SAFE_INTEGER,
  maxDistance = Number.MAX_SAFE_INTEGER,
}) {
  const [profile, parkings] = await Promise.all([
    buildDecisionProfile(userId),
    Parking.find({ isActive: true }).lean(),
  ]);
  const payload = await buildTrafficAwareRecommendations({
    parkings,
    userLocation,
    carType,
    maxPrice,
    maxDistance,
    preferredAreas: profile.preferredAreas || [],
  });
  const recommendations = payload.recommendations || [];
  const fastest = rankByStrategy(recommendations, "fastest", profile)[0] || null;
  const cheapest = rankByStrategy(recommendations, "cheapest", profile)[0] || null;
  const balanced = rankByStrategy(recommendations, "balanced", profile)[0] || null;

  const topScores = [fastest, cheapest, balanced]
    .filter(Boolean)
    .map((item) => item.ai?.strategyScore || item.ai?.recommendationScore || 0);
  const spread = topScores.length ? Math.max(...topScores) - Math.min(...topScores) : 0;

  return {
    branches: [
      fastest
        ? {
            key: "speed",
            label: "If speed matters",
            parkingId: fastest._id,
            title: fastest.title,
            summary: `ETA ${fastest.ai?.traffic?.eta || "Live"} with ${fastest.ai?.traffic?.trafficDelay || "+0 min"} delay.`,
          }
        : null,
      cheapest
        ? {
            key: "saving",
            label: "If saving matters",
            parkingId: cheapest._id,
            title: cheapest.title,
            summary: `Live price Rs. ${cheapest.dynamicPrice || cheapest.fare || 0}.`,
          }
        : null,
      balanced
        ? {
            key: "comfort",
            label: "If comfort matters",
            parkingId: balanced._id,
            title: balanced.title,
            summary: `Balanced route, availability, and demand profile.`,
          }
        : null,
    ].filter(Boolean),
    conflictResolution:
      spread <= 8
        ? "Both options are similar, selecting the cheaper option for practical value."
        : "The top option is clearly ahead once traffic and availability are combined.",
    behavioralModel:
      balanced
        ? `Simulated your usual choice and ${balanced.title} best matches your recent pattern.`
        : "Behavioral model is still learning which trade-off you prefer most.",
  };
}

module.exports = {
  buildDecisionTree,
};
