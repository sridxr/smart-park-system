const Booking = require("../../models/Booking");
const SavedLocation = require("../../models/SavedLocation");
const UserBehavior = require("../../models/UserBehavior");

function getTimeOfDayContext(now = new Date()) {
  const hour = now.getHours();

  if (hour >= 6 && hour < 11) {
    return { key: "morning", label: "Morning commute" };
  }

  if (hour >= 11 && hour < 17) {
    return { key: "midday", label: "Midday routine" };
  }

  if (hour >= 17 && hour < 21) {
    return { key: "evening", label: "Evening return" };
  }

  return { key: "night", label: "Late outing" };
}

function scoreSavedLocation(location, timeContext) {
  const label = String(location?.label || "").toLowerCase();
  let score = Number(location?.isPinned ? 18 : 8);

  if (timeContext.key === "morning" && (label.includes("office") || label.includes("work"))) {
    score += 35;
  }

  if (timeContext.key === "evening" && label.includes("home")) {
    score += 35;
  }

  if (timeContext.key === "midday" && (label.includes("mall") || label.includes("city") || label.includes("market"))) {
    score += 18;
  }

  return score;
}

async function buildIntentPrediction({ userId, userLocation = null }) {
  const [savedLocations, behavior, recentBookings] = await Promise.all([
    SavedLocation.find({ user: userId }).sort({ isPinned: -1, updatedAt: -1, createdAt: -1 }).lean(),
    UserBehavior.findOne({ user: userId }).lean(),
    Booking.find({ user: userId }).sort({ createdAt: -1 }).limit(25).populate("parkingId"),
  ]);

  const timeContext = getTimeOfDayContext();
  const preferredAreas = behavior?.preferredLocations || [];
  const scoredSavedLocations = savedLocations
    .map((location) => ({
      ...location,
      intentScore: scoreSavedLocation(location, timeContext),
    }))
    .sort((left, right) => right.intentScore - left.intentScore);
  const topSavedLocation = scoredSavedLocations[0] || null;
  const recentArea = recentBookings[0]?.parkingId?.address?.area || recentBookings[0]?.parkingId?.address?.landmark || "";
  const frequentArea = preferredAreas[0] || recentArea || "";
  const predictedDestination = topSavedLocation
    ? {
        label: topSavedLocation.label,
        fullText: topSavedLocation.fullText,
        location: topSavedLocation.location,
      }
    : frequentArea
      ? {
          label: frequentArea,
          fullText: frequentArea,
          location: userLocation,
        }
      : null;

  const confidence = Math.min(
    94,
    42 + scoredSavedLocations.length * 8 + preferredAreas.length * 5 + Math.min(20, recentBookings.length)
  );

  return {
    detected: Boolean(predictedDestination),
    confidence,
    timeContext,
    predictedDestination,
    message: predictedDestination
      ? `Heading to ${predictedDestination.label}? Found parking near your usual route.`
      : "Intent engine is still learning your next likely destination.",
    reasoning: [
      topSavedLocation ? `Frequent destination match: ${topSavedLocation.label}` : "No pinned destination match yet",
      preferredAreas.length ? `Top preferred area: ${preferredAreas[0]}` : "Area pattern still stabilizing",
      `Time context: ${timeContext.label}`,
    ],
    behavioralModel: predictedDestination
      ? `Simulated your usual choice and it aligns with heading toward ${predictedDestination.label}.`
      : "Behavioral model needs a few more repeated patterns to predict the next move confidently.",
  };
}

module.exports = {
  buildIntentPrediction,
};
