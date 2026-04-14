const express = require("express");

const Parking = require("../models/parking");
const Booking = require("../models/Booking");
const { buildLenderInsights } = require("../services/analyticsService");
const {
  activateScheduledBookings,
  releaseCompletedBookings,
  releaseExpiredPendingBookings,
} = require("../services/bookingLifecycleService");
const { enrichParkingResults } = require("../utils/aiEngine");
const { requireAuth } = require("../middleware/auth");
const { generateParkingChatResponse } = require("../services/ai/chatService");
const { getVehicleProfile } = require("../services/ai/vehicleCompatibilityService");

const router = express.Router();

router.use(requireAuth);

async function handleParkingChat(req, res) {
  await releaseExpiredPendingBookings();
  await activateScheduledBookings();
  await releaseCompletedBookings();
  const { message = "", location, carType = "sedan", maxPrice = Infinity } = req.body;
  const response = await generateParkingChatResponse({
    message,
    location,
    carType,
    maxPrice,
    vehicleProfile: getVehicleProfile(req.body.vehicle || {}),
  });

  return res.json(response);
}

router.post("/assistant", handleParkingChat);
router.post("/chat", handleParkingChat);

router.get("/insights/lender", requireAuth, async (req, res) => {
  await releaseExpiredPendingBookings();
  await activateScheduledBookings();
  await releaseCompletedBookings();
  const [bookings, listings] = await Promise.all([
    Booking.find({ lender: req.user._id }).sort({ createdAt: -1 }).limit(100),
    Parking.find({ owner: req.user._id }).lean(),
  ]);
  const intelligence = buildLenderInsights({ bookings, listings });

  res.json(intelligence);
});

module.exports = router;
