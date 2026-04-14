const Booking = require("../models/Booking");
const Parking = require("../models/parking");
const User = require("../models/user");
const { buildAdminAnalyticsSnapshot } = require("../services/analyticsService");
const { decorateParkingCollectionWithSensors } = require("../services/iotSimulationService");

async function getAdminAnalytics(req, res) {
  try {
    const [users, bookings, parkings] = await Promise.all([
      User.find().select("_id role"),
      Booking.find()
        .sort({ createdAt: -1 })
        .populate("parkingId", "timeSlot")
        .select("amount createdAt parkingId"),
      Parking.find().lean(),
    ]);

    const snapshot = buildAdminAnalyticsSnapshot({
      users,
      bookings,
      parkings,
    });

    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getIoTSummary(req, res) {
  try {
    const query =
      req.user.role === "admin" ? {} : { owner: req.user._id };
    const parkings = await Parking.find(query).lean();
    const decorated = decorateParkingCollectionWithSensors(parkings);

    return res.json(
      decorated.map((parking) => ({
        _id: parking._id,
        title: parking.title,
        availableSlots: parking.availableSlots,
        totalSlots: parking.totalSlots,
        sensorStatus: parking.sensorStatus,
        slotLayout: parking.slotLayout,
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAdminAnalytics,
  getIoTSummary,
};
