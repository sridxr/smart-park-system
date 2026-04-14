const Trip = require("../../models/Trip");
const Parking = require("../../models/parking");
const { buildTrafficAwareRecommendations } = require("./trafficRecommendationService");
const { buildDecisionProfile } = require("./decisionProfileService");
const { rankByStrategy } = require("./decisionIntelligenceUtils");

async function getLiveDecisionSwitch({
  userId,
  userLocation = null,
  carType = "sedan",
  maxPrice = Number.MAX_SAFE_INTEGER,
  maxDistance = Number.MAX_SAFE_INTEGER,
  mode = "balanced",
}) {
  const activeTrip = await Trip.findOne({ user: userId, status: { $ne: "completed" } }).populate("parking");

  if (!activeTrip?.parking || !userLocation) {
    return {
      shouldSwitch: false,
      message: "",
      currentOption: null,
      betterOption: null,
    };
  }

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
  const currentOption = ranked.find(
    (parking) => parking._id.toString() === activeTrip.parking._id.toString()
  );
  const betterOption = ranked[0];

  if (!currentOption || !betterOption || betterOption._id.toString() === currentOption._id.toString()) {
    return {
      shouldSwitch: false,
      message: "",
      currentOption: currentOption || null,
      betterOption: null,
    };
  }

  const currentEta = Number(currentOption.ai?.traffic?.etaMinutes || 0);
  const currentPrice = Number(currentOption.dynamicPrice || currentOption.fare || 0);
  const nextEta = Number(betterOption.ai?.traffic?.etaMinutes || 0);
  const nextPrice = Number(betterOption.dynamicPrice || betterOption.fare || 0);
  const savedMinutes = Math.max(0, currentEta - nextEta);
  const savedAmount = Math.max(0, currentPrice - nextPrice);
  const scoreGain =
    Number(betterOption.ai?.strategyScore || betterOption.ai?.recommendationScore || 0) -
    Number(currentOption.ai?.strategyScore || currentOption.ai?.recommendationScore || 0);
  const shouldSwitch = savedMinutes >= 3 || savedAmount >= 15 || scoreGain >= 10;

  return {
    shouldSwitch,
    currentOption: currentOption
      ? {
          parkingId: currentOption._id,
          title: currentOption.title,
          etaMinutes: currentEta,
          price: currentPrice,
        }
      : null,
    betterOption: betterOption
      ? {
          parkingId: betterOption._id,
          title: betterOption.title,
          etaMinutes: nextEta,
          price: nextPrice,
          routeQuality: betterOption.ai?.traffic?.routeQuality || "Balanced",
        }
      : null,
    savedMinutes,
    savedAmount,
    message: shouldSwitch
      ? `Better parking found — switch from ${currentOption.title} to ${betterOption.title}?`
      : "",
    explanation: shouldSwitch
      ? `${betterOption.title} trims about ${savedMinutes} minutes and saves Rs. ${savedAmount}.`
      : "Current route is still competitive.",
  };
}

module.exports = {
  getLiveDecisionSwitch,
};
