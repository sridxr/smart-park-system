const Parking = require("../../models/parking");
const { buildDecisionProfile } = require("./decisionProfileService");
const { buildIntentPrediction } = require("./intentService");
const { buildTrafficAwareRecommendations } = require("./trafficRecommendationService");
const { rankByStrategy } = require("./decisionIntelligenceUtils");

async function buildZeroClickSuggestion({
  userId,
  userLocation = null,
  carType = "sedan",
  maxPrice = Number.MAX_SAFE_INTEGER,
  maxDistance = Number.MAX_SAFE_INTEGER,
  mode = "balanced",
}) {
  const [intent, profile, parkings] = await Promise.all([
    buildIntentPrediction({ userId, userLocation }),
    buildDecisionProfile(userId),
    Parking.find({ isActive: true }).lean(),
  ]);

  const anchorLocation = intent.predictedDestination?.location || userLocation;
  const recommendationPayload = await buildTrafficAwareRecommendations({
    parkings,
    userLocation: anchorLocation,
    carType,
    maxPrice,
    maxDistance,
    preferredAreas: profile.preferredAreas || [],
  });
  const ranked = rankByStrategy(recommendationPayload.recommendations || [], mode, profile);
  const bestParking = ranked[0] || null;

  return {
    available: Boolean(bestParking),
    confidence: Math.min(95, Math.round(((intent.confidence || 0) + (bestParking?.ai?.recommendationScore || 0)) / 2)),
    predictedDestination: intent.predictedDestination || null,
    parking: bestParking,
    statusMessage: bestParking
      ? `Parking ready near ${intent.predictedDestination?.label || "your route"}`
      : "No auto-suggestion available right now.",
    explanation: bestParking
      ? `Predicted your next destination, checked live traffic, then picked ${bestParking.title} for the best balance of time and value.`
      : "Zero-click parking needs a stronger destination and inventory signal.",
    requiresConfirmation: true,
    confirmLabel: "Confirm parking",
    cancelLabel: "Not now",
  };
}

module.exports = {
  buildZeroClickSuggestion,
};
