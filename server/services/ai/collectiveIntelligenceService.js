const Booking = require("../../models/Booking");
const UserBehavior = require("../../models/UserBehavior");

function buildTrendMessage(topArea, secondArea) {
  if (!topArea) {
    return "Collective intelligence is warming up as more movement data arrives.";
  }

  if (topArea.movement === "outbound") {
    return `People are leaving ${topArea.area}, availability is increasing there.`;
  }

  return `Demand is building around ${topArea.area}, expect tighter availability soon.`;
}

async function buildCollectiveIntelligence() {
  const since = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const [recentBookings, behaviors] = await Promise.all([
    Booking.find({ createdAt: { $gte: since } }).populate("parkingId").lean(),
    UserBehavior.find().select("searchedLocations preferredLocations").lean(),
  ]);

  const areaSignals = new Map();
  recentBookings.forEach((booking) => {
    const area = booking.parkingId?.address?.area || booking.parkingId?.address?.landmark;
    if (!area) {
      return;
    }

    const current = areaSignals.get(area) || { area, bookings: 0, searches: 0 };
    current.bookings += 1;
    areaSignals.set(area, current);
  });

  behaviors.forEach((behavior) => {
    (behavior.searchedLocations || []).slice(-8).forEach((search) => {
      const area = search.area || search.district || search.fullText;
      if (!area) {
        return;
      }

      const current = areaSignals.get(area) || { area, bookings: 0, searches: 0 };
      current.searches += 1;
      areaSignals.set(area, current);
    });
  });

  const rankedAreas = [...areaSignals.values()]
    .map((area) => ({
      ...area,
      signal: area.bookings * 1.4 + area.searches * 0.8,
      movement: area.searches > area.bookings ? "inbound" : "outbound",
    }))
    .sort((left, right) => right.signal - left.signal)
    .slice(0, 5);

  const topArea = rankedAreas[0] || null;
  const secondArea = rankedAreas[1] || null;

  return {
    summary: buildTrendMessage(topArea, secondArea),
    movementTrends: rankedAreas,
    insight:
      topArea && secondArea
        ? `Activity is shifting from ${secondArea.area} toward ${topArea.area}.`
        : "Movement trends are still balancing across the network.",
  };
}

module.exports = {
  buildCollectiveIntelligence,
};
