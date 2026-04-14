const express = require("express");

const Booking = require("../models/Booking");
const Parking = require("../models/parking");
const User = require("../models/user");
const { analyzePeakHours } = require("../utils/aiEngine");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  buildAdminDecisionInsights,
  buildDailySeries,
  buildDemandZones,
  buildRoleDistribution,
  buildSystemAlerts,
} = require("../services/analyticsService");
const {
  activateScheduledBookings,
  releaseCompletedBookings,
  releaseExpiredPendingBookings,
} = require("../services/bookingLifecycleService");
const { emitRealtimeEvent } = require("../realtime/socketServer");
const { createSystemLog } = require("../services/systemLogService");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/users", async (req, res) => {
  await releaseExpiredPendingBookings();
  await activateScheduledBookings();
  await releaseCompletedBookings();
  const users = await User.find().sort({ createdAt: -1 }).select("-password -verificationToken");
  res.json(users);
});

router.get("/parkings", async (req, res) => {
  await releaseExpiredPendingBookings();
  await activateScheduledBookings();
  await releaseCompletedBookings();
  const parkings = await Parking.find().sort({ createdAt: -1 }).populate("owner", "name email role");
  res.json(parkings);
});

router.get("/bookings", async (req, res) => {
  await releaseExpiredPendingBookings();
  await activateScheduledBookings();
  await releaseCompletedBookings();
  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email role")
    .populate("parkingId", "title fare");
  res.json(bookings);
});

router.get("/stats", async (req, res) => {
  await releaseExpiredPendingBookings();
  await activateScheduledBookings();
  await releaseCompletedBookings();
  const [userCount, bookingCount, parkingCount, revenueAgg, busiest, allBookings, users, parkings] =
    await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Parking.countDocuments(),
    Booking.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    Booking.aggregate([
      { $group: { _id: "$parkingTitle", bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
    ]),
      Booking.find().select("createdAt amount parkingTitle"),
      User.find().select("role"),
      Parking.find().select("title demandLevel availableSlots totalSlots liveMetrics"),
    ]);
  const revenue = revenueAgg[0]?.total || 0;
  const peakHours = analyzePeakHours(allBookings);
  const roleDistribution = buildRoleDistribution(users);
  const revenueTrend = buildDailySeries(allBookings, (booking) => booking.amount || 0, 7);
  const bookingTrend = buildDailySeries(allBookings, () => 1, 7);
  const demandZones = buildDemandZones(allBookings);
  const busiestLocations = busiest.map((row) => ({
    location: row._id,
    bookings: row.bookings,
  }));
  const decisionInsights = buildAdminDecisionInsights({
    totalUsers: userCount,
    totalBookings: bookingCount,
    totalParkings: parkingCount,
    revenue,
    busiestLocations,
    peakHours,
    roleDistribution,
  });
  const systemAlerts = buildSystemAlerts({
    parkings,
    demandZones,
  });

  res.json({
    totalUsers: userCount,
    totalBookings: bookingCount,
    totalParkings: parkingCount,
    revenue,
    busiestLocations,
    peakHours,
    roleDistribution,
    revenueTrend,
    bookingTrend,
    demandZones,
    decisionInsights,
    systemAlerts,
  });
});

router.patch("/users/:id/status", async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status === "blocked" ? "blocked" : "active" },
    { new: true }
  ).select("-password -verificationToken");

  await createSystemLog({
    actor: req.user,
    action: "admin.user.status-updated",
    targetType: "user",
    targetId: user?._id?.toString() || req.params.id,
    description: `Admin changed user status to ${user?.status || req.body.status}.`,
  });

  emitRealtimeEvent({
    event: "user:changed",
    payload: {
      action: "status-updated",
      userId: user?._id?.toString() || req.params.id,
      status: user?.status || req.body.status,
    },
    rooms: ["role:admin", user?._id ? `user:${user._id.toString()}` : ""],
  });

  res.json(user);
});

router.delete("/users/:id", async (req, res) => {
  const existingUser = await User.findById(req.params.id).select("_id");
  await User.findByIdAndDelete(req.params.id);

  await createSystemLog({
    actor: req.user,
    action: "admin.user.deleted",
    targetType: "user",
    targetId: req.params.id,
    description: "Admin deleted a user account.",
  });

  emitRealtimeEvent({
    event: "user:changed",
    payload: {
      action: "deleted",
      userId: req.params.id,
    },
    rooms: ["role:admin", existingUser?._id ? `user:${existingUser._id.toString()}` : ""],
  });

  res.json({ ok: true });
});

module.exports = router;
