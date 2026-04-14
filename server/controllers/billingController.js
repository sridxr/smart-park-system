const Trip = require("../models/Trip");
const { buildTripBilling } = require("../services/trip/tripService");

async function getCurrentBilling(req, res) {
  try {
    const trip = await Trip.findOne({
      user: req.user._id,
      status: { $ne: "completed" },
    }).populate("parking booking vehicle");

    if (!trip) {
      return res.json({
        active: false,
        durationMinutes: 0,
        durationHours: 0,
        totalPrice: 0,
      });
    }

    return res.json({
      active: true,
      ...(await buildTripBilling(trip)),
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

module.exports = {
  getCurrentBilling,
};
