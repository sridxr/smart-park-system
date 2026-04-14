const Booking = require("../../models/Booking");
const Parking = require("../../models/parking");
const ParkingReview = require("../../models/ParkingReview");
const SavedLocation = require("../../models/SavedLocation");
const Trip = require("../../models/Trip");
const UserBehavior = require("../../models/UserBehavior");
const Vehicle = require("../../models/Vehicle");
const { getDemandScore, predictDemandLevel } = require("../../utils/aiEngine");
const { buildTrafficAwareRecommendations } = require("./trafficRecommendationService");

function getTimeMode(now = new Date()) {
  const hour = now.getHours();
  if (hour < 11) return "nearest";
  if (hour < 17) return "balanced";
  return "cheapest";
}

function buildDemandForecast(bookings = []) {
  const currentHour = new Date().getHours();
  const currentHourBookings = bookings.filter(
    (booking) => new Date(booking.createdAt).getHours() === currentHour
  ).length;

  return {
    hour: (currentHour + 2) % 24,
    message:
      currentHourBookings >= 3
        ? "High demand expected in 2 hours"
        : "Stable demand expected in 2 hours",
  };
}

async function buildTrustScore(parkingId) {
  const [parking, reviews, trips] = await Promise.all([
    Parking.findById(parkingId).lean(),
    ParkingReview.find({ parking: parkingId }),
    Trip.find({ parking: parkingId }),
  ]);

  if (!parking) {
    return 0;
  }

  const ratingScore = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 20
    : (parking.rating || 4.5) * 20;
  const availabilityAccuracy = 70 + Math.min(20, Number(parking.availableSlots || 0));
  const usageFrequency = Math.min(100, trips.length * 6);

  return Number(
    Math.min(100, ratingScore * 0.45 + availabilityAccuracy * 0.3 + usageFrequency * 0.25).toFixed(1)
  );
}

async function buildMobilityInsights({
  userId,
  userLocation = null,
  destination = null,
  vehicleId = null,
  maxPrice = Number.MAX_SAFE_INTEGER,
}) {
  const [behavior, vehicles, savedLocations, bookings, activeTrip] = await Promise.all([
    UserBehavior.findOne({ user: userId }).lean(),
    Vehicle.find({ user: userId }).lean(),
    SavedLocation.find({ user: userId }).sort({ isPinned: -1, createdAt: -1 }).lean(),
    Booking.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean(),
    Trip.findOne({ user: userId, status: { $ne: "completed" } }).populate("parking"),
  ]);

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle._id.toString() === String(vehicleId || "")) ||
    vehicles.find((vehicle) => vehicle.isDefault) ||
    vehicles[0] ||
    null;
  const preferredAreas = behavior?.preferredLocations || [];
  const contextMode = getTimeMode();
  const parkings = await Parking.find({ isActive: true }).lean();
  const referenceLocation = destination || userLocation;

  const trafficRecommendations = await buildTrafficAwareRecommendations({
    parkings,
    userLocation: referenceLocation,
    carType: selectedVehicle?.vehicleType || "sedan",
    maxPrice,
    preferredAreas,
    vehicleProfile: selectedVehicle,
  });

  const bestParking = trafficRecommendations.bestParking || null;
  const trustScore = bestParking ? await buildTrustScore(bestParking._id) : 0;
  const forecast = buildDemandForecast(bookings);

  const reminders = [];
  if (savedLocations[0]) {
    reminders.push(`Leaving now? Book parking near ${savedLocations[0].label}.`);
  }
  if (bestParking?.ai?.demandLevel === "High") {
    reminders.push(`${bestParking.title} is filling fast. Consider booking soon.`);
  }
  if (activeTrip?.status === "parked" && activeTrip.plannedEndTime) {
    const remainingMinutes = Math.round(
      (new Date(activeTrip.plannedEndTime).getTime() - Date.now()) / 60000
    );
    if (remainingMinutes <= 15) {
      reminders.push("Parking session ending soon. Extend if you need more time.");
    }
  }

  return {
    contextMode,
    selectedVehicle,
    savedLocations,
    activeTrip,
    oneTapRecommendation: bestParking
      ? {
          parking: bestParking,
          explanation:
            contextMode === "nearest"
              ? "Morning mode prefers the fastest nearby parking."
              : contextMode === "cheapest"
                ? "Evening mode is prioritizing value and route efficiency."
                : "Balanced mode is optimizing distance, traffic, and availability.",
        }
      : null,
    demandForecast: forecast,
    reminders,
    trustScore,
    trafficSummary: {
      eta: trafficRecommendations.eta,
      trafficDelay: trafficRecommendations.trafficDelay,
      routeQuality: trafficRecommendations.routeQuality,
      explanation: trafficRecommendations.explanation,
    },
  };
}

async function buildLenderMobilityForecast(ownerId) {
  const parkings = await Parking.find({ owner: ownerId }).lean();
  const bookings = await Booking.find({ lender: ownerId }).lean();
  const recentBookings = bookings.filter(
    (booking) => new Date(booking.createdAt).getTime() >= Date.now() - 4 * 60 * 60 * 1000
  ).length;

  return {
    message:
      recentBookings >= 4 ||
      parkings.some((parking) => Number(parking.liveMetrics?.occupancyRate || 0) >= 70)
        ? "High demand expected in 2 hours"
        : "Stable demand expected for the next 2 hours",
    demandLevel: predictDemandLevel({
      totalSlots: parkings.reduce((sum, parking) => sum + Number(parking.totalSlots || 0), 0),
      availableSlots: parkings.reduce((sum, parking) => sum + Number(parking.availableSlots || 0), 0),
      recentBookings,
    }),
    demandScore: getDemandScore({
      totalSlots: parkings.reduce((sum, parking) => sum + Number(parking.totalSlots || 0), 0),
      availableSlots: parkings.reduce((sum, parking) => sum + Number(parking.availableSlots || 0), 0),
      recentBookings,
    }),
  };
}

module.exports = {
  buildLenderMobilityForecast,
  buildMobilityInsights,
  buildTrustScore,
};
