const Booking = require("../../models/Booking");
const FraudLog = require("../../models/FraudLog");
const User = require("../../models/user");

async function upsertFraudFlag({ userId, email, type, severity, message, metadata }) {
  const recentOpen = await FraudLog.findOne({
    user: userId,
    type,
    status: "open",
    createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
  });

  if (recentOpen) {
    recentOpen.message = message;
    recentOpen.metadata = metadata;
    recentOpen.severity = severity;
    await recentOpen.save();
    return recentOpen;
  }

  return FraudLog.create({
    user: userId,
    email,
    type,
    severity,
    message,
    metadata,
  });
}

async function analyzeRapidBookings(userId) {
  const [user, recentBookings] = await Promise.all([
    User.findById(userId).select("email name"),
    Booking.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    }).select("_id parkingTitle createdAt"),
  ]);

  if (recentBookings.length <= 5) {
    return null;
  }

  return upsertFraudFlag({
    userId,
    email: user?.email || "",
    type: "rapid-bookings",
    severity: recentBookings.length > 8 ? "critical" : "high",
    message: `${user?.name || "User"} created ${recentBookings.length} bookings in under a minute.`,
    metadata: {
      bookingIds: recentBookings.map((booking) => booking._id.toString()),
      parkingTitles: recentBookings.map((booking) => booking.parkingTitle),
    },
  });
}

async function analyzeCancellationPattern(userId) {
  const [user, recentCancellations] = await Promise.all([
    User.findById(userId).select("email name"),
    Booking.find({
      user: userId,
      status: "cancelled",
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }).select("_id parkingTitle createdAt"),
  ]);

  if (recentCancellations.length < 3) {
    return null;
  }

  return upsertFraudFlag({
    userId,
    email: user?.email || "",
    type: "repeated-cancellations",
    severity: recentCancellations.length >= 5 ? "high" : "medium",
    message: `${user?.name || "User"} has ${recentCancellations.length} cancelled bookings in the last 7 days.`,
    metadata: {
      bookingIds: recentCancellations.map((booking) => booking._id.toString()),
      parkingTitles: recentCancellations.map((booking) => booking.parkingTitle),
    },
  });
}

async function evaluateFraudSignals(userId) {
  const [rapidFlag, cancellationFlag] = await Promise.all([
    analyzeRapidBookings(userId),
    analyzeCancellationPattern(userId),
  ]);

  return [rapidFlag, cancellationFlag].filter(Boolean);
}

async function listFraudLogs() {
  return FraudLog.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email role status");
}

module.exports = {
  evaluateFraudSignals,
  listFraudLogs,
};
