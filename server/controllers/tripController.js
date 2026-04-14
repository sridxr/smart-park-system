const Trip = require("../models/Trip");
const {
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
} = require("../services/trip/tripService");

async function startTripSession(req, res) {
  try {
    const trip = await startTrip({
      userId: req.user._id,
      bookingId: req.body.bookingId,
      vehicleId: req.body.vehicleId,
    });
    return res.status(201).json(trip);
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }
}

async function getTripState(req, res) {
  try {
    return res.json(await getTripOverview(req.user._id));
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function updateTripProgress(req, res) {
  try {
    return res.json(
      await updateTripStatus({
        tripId: req.params.tripId,
        userId: req.user._id,
        status: req.body.status,
      })
    );
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }
}

async function reportLocation(req, res) {
  try {
    return res.json(
      await reportTripLocation({
        tripId: req.params.tripId,
        userId: req.user._id,
        location: req.body.location || {},
      })
    );
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }
}

async function extendTripTime(req, res) {
  try {
    return res.json(
      await extendTrip({
        tripId: req.params.tripId,
        userId: req.user._id,
        extraMinutes: Number(req.body.extraMinutes || 30),
      })
    );
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }
}

async function finishTrip(req, res) {
  try {
    return res.json(
      await completeTrip({
        tripId: req.params.tripId,
        userId: req.user._id,
      })
    );
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }
}

async function getTripBillingState(req, res) {
  try {
    const trip = await Trip.findOne({
      _id: req.params.tripId,
      user: req.user._id,
    }).populate("parking booking vehicle");

    if (!trip) {
      return res.status(404).json({ msg: "Trip not found" });
    }

    return res.json(await buildTripBilling(trip));
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function addReview(req, res) {
  try {
    return res.status(201).json(
      await submitParkingReview({
        userId: req.user._id,
        tripId: req.params.tripId,
        rating: req.body.rating,
        review: req.body.review,
      })
    );
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }
}

async function getLenderPerformance(req, res) {
  try {
    return res.json(await buildLenderPerformance(req.user._id));
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function getAdminTripSummary(req, res) {
  try {
    return res.json(await buildAdminMobilitySummary());
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

module.exports = {
  addReview,
  extendTripTime,
  finishTrip,
  getAdminTripSummary,
  getLenderPerformance,
  getTripBillingState,
  getTripState,
  reportLocation,
  startTripSession,
  updateTripProgress,
};
