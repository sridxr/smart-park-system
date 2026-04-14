const Booking = require("../../models/Booking");
const Notification = require("../../models/Notification");
const ParkingReview = require("../../models/ParkingReview");
const Parking = require("../../models/parking");
const Trip = require("../../models/Trip");
const Vehicle = require("../../models/Vehicle");
const { createNotification } = require("../notificationService");
const { createSystemLog } = require("../systemLogService");
const { getTrafficData } = require("../traffic/googleTrafficService");
const { calculateLiveBilling } = require("../billing/billingService");
const { detectArrival } = require("./arrivalService");
const { emitRealtimeEvent } = require("../../realtime/socketServer");

function getRooms(userId) {
  return userId ? [`user:${userId.toString()}`] : [];
}

async function ensureOverstayAlert(trip, parking) {
  if (!trip?.plannedEndTime || trip?.status === "completed" || trip?.reminderSentAt) {
    return;
  }

  const remainingMs = new Date(trip.plannedEndTime).getTime() - Date.now();
  if (remainingMs > 5 * 60 * 1000 || remainingMs < 0) {
    return;
  }

  await createNotification({
    userId: trip.user,
    title: "Parking ending soon",
    message: `${parking?.title || "Your parking"} is ending in less than 5 minutes.`,
    type: "alert",
    actionUrl: "/user/bookings",
    metadata: { tripId: trip._id.toString(), kind: "overstay-warning" },
  });

  trip.reminderSentAt = new Date();
  await trip.save();
}

async function startTrip({ userId, bookingId, vehicleId = null }) {
  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId,
    status: { $in: ["confirmed", "pending", "completed"] },
  }).populate("parkingId");

  if (!booking || !booking.parkingId) {
    throw new Error("Booking not found for trip start");
  }

  const existing = await Trip.findOne({
    booking: booking._id,
    user: userId,
    status: { $ne: "completed" },
  });

  if (existing) {
    return Trip.findById(existing._id).populate("parking booking vehicle");
  }

  if (vehicleId) {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: userId });
    if (!vehicle) {
      throw new Error("Selected vehicle could not be found");
    }
  }

  const trip = await Trip.create({
    user: userId,
    booking: booking._id,
    parking: booking.parkingId._id,
    vehicle: vehicleId || null,
    status: "navigating",
    startTime: new Date(),
    plannedEndTime: booking.endTime || null,
  });

  await createSystemLog({
    actor: { _id: userId },
    action: "trip.started",
    targetType: "trip",
    targetId: trip._id.toString(),
    description: `Trip started for ${booking.parkingTitle}.`,
  });

  emitRealtimeEvent({
    event: "trip:changed",
    payload: { tripId: trip._id.toString(), userId: userId.toString(), status: trip.status },
    rooms: getRooms(userId),
  });

  return Trip.findById(trip._id).populate("parking booking vehicle");
}

async function reportTripLocation({ tripId, userId, location }) {
  const trip = await Trip.findOne({ _id: tripId, user: userId }).populate("parking booking vehicle");

  if (!trip) {
    throw new Error("Trip not found");
  }

  trip.lastKnownLocation = {
    lat: Number(location?.lat) || null,
    lng: Number(location?.lng) || null,
    fullText: location?.fullText || "",
  };

  const arrival = detectArrival(location, trip.parking?.location);
  if (arrival.arrived && trip.status === "navigating") {
    trip.status = "arrived";
    trip.arrivalTime = trip.arrivalTime || new Date();

    await createNotification({
      userId,
      title: "You have arrived",
      message: `You have arrived at ${trip.parking?.title || "your parking"}.`,
      type: "insight",
      actionUrl: "/user/bookings",
      metadata: { tripId: trip._id.toString(), kind: "arrival-detected" },
    });
  }

  const traffic = await getTrafficData(location, trip.parking?.location).catch(() => null);
  if (traffic) {
    trip.latestEtaMinutes = traffic.trafficDuration?.valueMinutes || null;
    trip.latestTrafficDelayMinutes = traffic.trafficDelay?.valueMinutes || 0;
    trip.routeQuality = traffic.routeQuality || "Unknown";
  }

  await trip.save();
  await ensureOverstayAlert(trip, trip.parking);

  emitRealtimeEvent({
    event: "trip:changed",
    payload: { tripId: trip._id.toString(), userId: userId.toString(), status: trip.status },
    rooms: getRooms(userId),
  });

  return Trip.findById(trip._id).populate("parking booking vehicle");
}

async function updateTripStatus({ tripId, userId, status }) {
  const trip = await Trip.findOne({ _id: tripId, user: userId }).populate("parking booking vehicle");

  if (!trip) {
    throw new Error("Trip not found");
  }

  const allowedTransitions = {
    navigating: ["arrived"],
    arrived: ["parked"],
    parked: ["completed"],
    completed: [],
  };

  if (!(allowedTransitions[trip.status] || []).includes(status)) {
    throw new Error("Invalid trip status transition");
  }

  trip.status = status;
  if (status === "arrived") {
    trip.arrivalTime = trip.arrivalTime || new Date();
  }
  if (status === "parked") {
    trip.parkedAt = trip.parkedAt || new Date();
  }
  if (status === "completed") {
    trip.endTime = trip.endTime || new Date();
  }

  await trip.save();

  emitRealtimeEvent({
    event: "trip:changed",
    payload: { tripId: trip._id.toString(), userId: userId.toString(), status: trip.status },
    rooms: getRooms(userId),
  });

  return Trip.findById(trip._id).populate("parking booking vehicle");
}

async function extendTrip({ tripId, userId, extraMinutes = 30 }) {
  const trip = await Trip.findOne({ _id: tripId, user: userId }).populate("parking booking vehicle");

  if (!trip) {
    throw new Error("Trip not found");
  }

  const nextEnd = trip.plannedEndTime ? new Date(trip.plannedEndTime) : new Date();
  nextEnd.setMinutes(nextEnd.getMinutes() + Number(extraMinutes || 30));
  trip.plannedEndTime = nextEnd;
  trip.extraDurationMinutes += Number(extraMinutes || 30);
  trip.reminderSentAt = null;
  await trip.save();

  await createNotification({
    userId,
    title: "Parking extended",
    message: `${trip.parking?.title || "Your parking"} was extended by ${extraMinutes} minutes.`,
    type: "booking",
    actionUrl: "/user/bookings",
    metadata: { tripId: trip._id.toString(), kind: "trip-extended" },
  });

  emitRealtimeEvent({
    event: "trip:changed",
    payload: { tripId: trip._id.toString(), userId: userId.toString(), status: trip.status },
    rooms: getRooms(userId),
  });

  return Trip.findById(trip._id).populate("parking booking vehicle");
}

async function getTripOverview(userId) {
  const [activeTrip, tripHistory] = await Promise.all([
    Trip.findOne({ user: userId, status: { $ne: "completed" } })
      .sort({ createdAt: -1 })
      .populate("parking booking vehicle"),
    Trip.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("parking booking vehicle"),
  ]);

  if (activeTrip) {
    await ensureOverstayAlert(activeTrip, activeTrip.parking);
  }

  return { activeTrip, tripHistory };
}

async function completeTrip({ tripId, userId }) {
  const trip = await Trip.findOne({ _id: tripId, user: userId }).populate("parking booking vehicle");

  if (!trip) {
    throw new Error("Trip not found");
  }

  trip.status = "completed";
  trip.endTime = trip.endTime || new Date();
  await trip.save();

  emitRealtimeEvent({
    event: "trip:changed",
    payload: { tripId: trip._id.toString(), userId: userId.toString(), status: trip.status },
    rooms: getRooms(userId),
  });

  return Trip.findById(trip._id).populate("parking booking vehicle");
}

async function submitParkingReview({ userId, tripId, rating, review }) {
  const trip = await Trip.findOne({ _id: tripId, user: userId }).populate("parking");

  if (!trip) {
    throw new Error("Trip not found");
  }

  const saved = await ParkingReview.findOneAndUpdate(
    { user: userId, trip: trip._id, parking: trip.parking._id },
    {
      rating: Number(rating),
      review: review || "",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const aggregate = await ParkingReview.aggregate([
    { $match: { parking: trip.parking._id } },
    {
      $group: {
        _id: "$parking",
        averageRating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  await Parking.findByIdAndUpdate(trip.parking._id, {
    rating: Number((aggregate[0]?.averageRating || trip.parking.rating || 4.5).toFixed(1)),
    ratingCount: aggregate[0]?.ratingCount || trip.parking.ratingCount || 0,
  });

  return saved;
}

async function buildTripBilling(trip) {
  const pricePerHour =
    Number(trip?.parking?.pricePerHour || trip?.parking?.dynamicPrice || trip?.parking?.fare || 0);
  const billingStartTime = trip?.parkedAt || trip?.arrivalTime || trip?.startTime;
  const live = calculateLiveBilling({
    startTime: billingStartTime,
    endTime: trip?.endTime || null,
    pricePerHour,
  });

  return {
    tripId: trip?._id || "",
    status: trip?.status || "completed",
    ratePerHour: pricePerHour,
    ...live,
    remainingMinutes: trip?.plannedEndTime
      ? Math.max(0, Math.round((new Date(trip.plannedEndTime).getTime() - Date.now()) / 60000))
      : 0,
    plannedEndTime: trip?.plannedEndTime || null,
  };
}

async function buildLenderPerformance(ownerId) {
  const parkings = await Parking.find({ owner: ownerId }).lean();
  const parkingIds = parkings.map((parking) => parking._id);
  const [trips, reviews] = await Promise.all([
    Trip.find({ parking: { $in: parkingIds } }).populate("parking"),
    ParkingReview.find({ parking: { $in: parkingIds } }),
  ]);

  const revenue = trips.reduce((sum, trip) => {
    const billing = calculateLiveBilling({
      startTime: trip.parkedAt || trip.arrivalTime || trip.startTime,
      endTime: trip.endTime || null,
      pricePerHour:
        Number(trip.parking?.pricePerHour || trip.parking?.dynamicPrice || trip.parking?.fare || 0),
    });
    return sum + billing.totalPrice;
  }, 0);

  const occupancyRate = parkings.length
    ? Math.round(
        parkings.reduce((sum, parking) => sum + Number(parking.liveMetrics?.occupancyRate || 0), 0) /
          parkings.length
      )
    : 0;

  const hourMap = new Map();
  trips.forEach((trip) => {
    const hour = new Date(trip.createdAt).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  const peakHours = [...hourMap.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([hour]) => hour);

  return {
    occupancyRate,
    revenue: Math.round(revenue),
    peakHours,
    averageRating: reviews.length
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
      : 4.5,
    completedTrips: trips.filter((trip) => trip.status === "completed").length,
  };
}

async function buildAdminMobilitySummary() {
  const [trips, reviews, alertPressure] = await Promise.all([
    Trip.find(),
    ParkingReview.find(),
    Notification.countDocuments({ type: "alert", read: false }),
  ]);

  const completedTrips = trips.filter((trip) => trip.status === "completed");

  return {
    activeTrips: trips.filter((trip) => trip.status !== "completed").length,
    completedTrips: completedTrips.length,
    averageTripDurationMinutes: completedTrips.length
      ? Math.round(
          completedTrips.reduce((sum, trip) => {
            const billing = calculateLiveBilling({
              startTime: trip.parkedAt || trip.arrivalTime || trip.startTime,
              endTime: trip.endTime,
              pricePerHour: 0,
            });
            return sum + billing.durationMinutes;
          }, 0) / completedTrips.length
        )
      : 0,
    averageRating: reviews.length
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
      : 0,
    alertPressure,
  };
}

module.exports = {
  buildAdminMobilitySummary,
  buildLenderPerformance,
  buildTripBilling,
  completeTrip,
  extendTrip,
  getTripOverview,
  reportTripLocation,
  startTrip,
  submitParkingReview,
  updateTripStatus,
};
