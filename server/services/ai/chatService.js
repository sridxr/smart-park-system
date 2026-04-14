const Parking = require("../../models/parking");
const { enrichParkingResults } = require("../../utils/aiEngine");

function inferIntent(message = "") {
  const normalized = message.toLowerCase();

  if (normalized.includes("cheap")) {
    return "cheapest";
  }
  if (normalized.includes("least crowded") || normalized.includes("less crowded")) {
    return "calm";
  }
  if (normalized.includes("closest") || normalized.includes("near")) {
    return "closest";
  }
  if (normalized.includes("suv")) {
    return "suv";
  }

  return "balanced";
}

function rankMatches(ranked, intent) {
  if (intent === "cheapest") {
    return [...ranked].sort((left, right) => Number(left.dynamicPrice || left.fare) - Number(right.dynamicPrice || right.fare));
  }
  if (intent === "calm") {
    return [...ranked].sort((left, right) => (right.availableSlots || 0) - (left.availableSlots || 0));
  }
  if (intent === "closest") {
    return [...ranked].sort((left, right) => (left.ai?.distanceKm ?? Number.MAX_SAFE_INTEGER) - (right.ai?.distanceKm ?? Number.MAX_SAFE_INTEGER));
  }
  if (intent === "suv") {
    return ranked.filter((parking) => parking.ai?.carFit !== "Not Suitable");
  }
  return ranked;
}

async function generateParkingChatResponse({
  message = "",
  location = null,
  carType = "sedan",
  maxPrice = Number.MAX_SAFE_INTEGER,
  vehicleProfile = null,
}) {
  const parkings = await Parking.find({ isActive: true }).lean();
  const ranked = enrichParkingResults(parkings, {
    userLocation: location,
    carType,
    maxPrice,
    vehicleProfile,
  });

  const intent = inferIntent(message);
  const matches = rankMatches(ranked, intent).slice(0, 3);

  if (!matches.length) {
    return {
      answer: "I could not find a strong parking match right now. Try widening your price range or changing the location.",
      matches: [],
      intent,
    };
  }

  const lead = matches[0];
  const distanceText =
    lead.ai?.distanceKm !== null && lead.ai?.distanceKm !== undefined
      ? `${lead.ai.distanceKm} km away`
      : "nearby";

  return {
    answer: `${lead.title} looks strongest for this request. It is ${distanceText}, priced at Rs. ${lead.dynamicPrice || lead.fare}, and stands out because ${String(lead.ai?.explanation || "it balances price and availability").replace(/\.$/, "").toLowerCase()}.`,
    matches,
    intent,
  };
}

module.exports = {
  generateParkingChatResponse,
};
