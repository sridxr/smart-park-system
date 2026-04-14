const Booking = require("../../models/Booking");
const DecisionProfile = require("../../models/DecisionProfile");
const UserBehavior = require("../../models/UserBehavior");

function roundToSingleDecimal(value = 0) {
  return Number(value.toFixed(1));
}

function average(numbers = []) {
  if (!numbers.length) {
    return 0;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function getAverageBookingHour(histogram = []) {
  const total = histogram.reduce((sum, value) => sum + value, 0);
  if (!total) {
    return 0;
  }

  const weighted = histogram.reduce((sum, value, index) => sum + value * index, 0);
  return roundToSingleDecimal(weighted / total);
}

function getWalkingTolerance(avgSearchDistance = 0) {
  if (avgSearchDistance >= 10) {
    return "long";
  }

  if (avgSearchDistance >= 6) {
    return "balanced";
  }

  return "short";
}

function buildDecisionStyle(profile) {
  const style = [];

  style.push(profile.prefersCheap ? "Prefers cheaper parking" : "Optimizes for convenience over the lowest fare");
  style.push(profile.prefersFast ? "Values faster arrival and lower delay" : "Accepts a slightly longer route for better value");
  style.push(
    profile.walkingTolerance === "long"
      ? "Accepts longer walking distance"
      : profile.walkingTolerance === "balanced"
        ? "Comfortable with a moderate walk"
        : "Prefers closest walking access"
  );
  style.push(profile.avoidsTraffic ? "Avoids traffic-heavy areas" : "Can tolerate moderate traffic when the value is right");

  return style;
}

async function buildDecisionProfile(userId) {
  const [behavior, bookings] = await Promise.all([
    UserBehavior.findOne({ user: userId }).lean(),
    Booking.find({ user: userId }).sort({ createdAt: -1 }).limit(80).populate("parkingId"),
  ]);

  const searches = behavior?.searchedLocations || [];
  const preferredAreas = behavior?.preferredLocations || [];
  const preferredPriceRange = behavior?.preferredPriceRange || { min: 0, max: 0 };
  const bookingHistogram = behavior?.bookingHourHistogram || [];
  const avgSearchDistance = average(
    searches.map((search) => Number(search.maxDistance || 0)).filter((value) => value > 0)
  );
  const avgBookedAmount = average(bookings.map((booking) => Number(booking.amount || 0)).filter(Boolean));
  const avgTrafficSensitiveDistance = average(
    bookings
      .map((booking) => Number(booking.parkingId?.ai?.distanceKm || booking.parkingId?.distanceKm || 0))
      .filter((value) => value > 0)
  );
  const avgBookingTime = getAverageBookingHour(bookingHistogram);
  const prefersCheap =
    Number(preferredPriceRange.max || 0) > 0
      ? Number(preferredPriceRange.max || 0) <= 250
      : avgBookedAmount > 0 && avgBookedAmount <= 220;
  const prefersFast = avgSearchDistance > 0 ? avgSearchDistance <= 5.5 : avgTrafficSensitiveDistance <= 2.5;
  const avoidsTraffic = prefersFast || avgBookingTime >= 8 && avgBookingTime <= 10;
  const walkingTolerance = getWalkingTolerance(avgSearchDistance);
  const confidence = Math.min(96, 38 + searches.length * 4 + bookings.length * 2);

  const profile = await DecisionProfile.findOneAndUpdate(
    { user: userId },
    {
      prefersCheap,
      prefersFast,
      preferredAreas,
      avgBookingTime,
      walkingTolerance,
      avoidsTraffic,
      confidence,
      lastComputedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    ...profile,
    avgBookingTime,
    preferredAreas,
    decisionStyle: buildDecisionStyle({
      prefersCheap,
      prefersFast,
      walkingTolerance,
      avoidsTraffic,
    }),
    summary: `Learns that you ${prefersCheap ? "value savings" : "prioritize convenience"}, ${
      prefersFast ? "care about faster arrival" : "can trade a bit of speed for price"
    }, and usually search around ${preferredAreas[0] || "your active zones"}.`,
  };
}

module.exports = {
  buildDecisionProfile,
};
