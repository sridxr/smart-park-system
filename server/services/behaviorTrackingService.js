const UserBehavior = require("../models/UserBehavior");

function capEntries(entries = [], limit = 20) {
  return entries.slice(Math.max(0, entries.length - limit));
}

function summarizePreferredLocations(searchEntries = [], bookingEntries = []) {
  const counts = [...searchEntries, ...bookingEntries].reduce((accumulator, entry) => {
    const key = entry.area || entry.fullText || entry.title || "";
    if (!key) {
      return accumulator;
    }
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([location]) => location);
}

function summarizePreferredPrice(searchEntries = [], bookingEntries = []) {
  const observedPrices = [
    ...searchEntries.map((entry) => Number(entry.maxPrice) || 0),
    ...bookingEntries.map((entry) => Number(entry.amount) || 0),
  ].filter((value) => value > 0);

  if (!observedPrices.length) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...observedPrices),
    max: Math.max(...observedPrices),
  };
}

async function getOrCreateBehavior(userId) {
  let behavior = await UserBehavior.findOne({ user: userId });
  if (!behavior) {
    behavior = await UserBehavior.create({ user: userId });
  }
  return behavior;
}

async function recordSearchBehavior({
  userId,
  location = {},
  filters = {},
  query = "",
}) {
  const behavior = await getOrCreateBehavior(userId);
  behavior.searchedLocations.push({
    query,
    fullText: location.fullText || "",
    area: location.area || "",
    district: location.district || "",
    lat: Number.isFinite(Number(location.lat)) ? Number(location.lat) : null,
    lng: Number.isFinite(Number(location.lng)) ? Number(location.lng) : null,
    carType: filters.carType || "sedan",
    maxPrice: Number(filters.maxPrice) || 0,
    maxDistance: Number(filters.maxDistance) || 0,
    searchedAt: new Date(),
  });
  behavior.searchedLocations = capEntries(behavior.searchedLocations);
  behavior.preferredLocations = summarizePreferredLocations(
    behavior.searchedLocations,
    behavior.bookedLocations
  );
  behavior.preferredPriceRange = summarizePreferredPrice(
    behavior.searchedLocations,
    behavior.bookedLocations
  );
  await behavior.save();
  return behavior;
}

async function recordBookingBehavior({
  userId,
  parking,
  amount = 0,
}) {
  const behavior = await getOrCreateBehavior(userId);
  const bookedAt = new Date();
  behavior.bookedLocations.push({
    parkingId: parking._id,
    title: parking.title,
    area: parking.address?.area || "",
    district: parking.address?.district || "",
    amount,
    bookedAt,
  });
  behavior.bookedLocations = capEntries(behavior.bookedLocations);

  const bookingHour = bookedAt.getHours();
  if (!Array.isArray(behavior.bookingHourHistogram) || behavior.bookingHourHistogram.length !== 24) {
    behavior.bookingHourHistogram = Array.from({ length: 24 }, () => 0);
  }
  behavior.bookingHourHistogram[bookingHour] += 1;
  behavior.preferredLocations = summarizePreferredLocations(
    behavior.searchedLocations,
    behavior.bookedLocations
  );
  behavior.preferredPriceRange = summarizePreferredPrice(
    behavior.searchedLocations,
    behavior.bookedLocations
  );
  await behavior.save();
  return behavior;
}

async function getBehaviorSnapshot(userId) {
  return getOrCreateBehavior(userId);
}

module.exports = {
  getBehaviorSnapshot,
  recordBookingBehavior,
  recordSearchBehavior,
};
