const { buildPersonalizationPayload } = require("../services/ai/personalizationService");
const { buildTrafficAwareRecommendations } = require("../services/ai/trafficRecommendationService");
const { listFraudLogs } = require("../services/ai/fraudDetectionService");
const { recordSearchBehavior, getBehaviorSnapshot } = require("../services/behaviorTrackingService");
const { listNotificationsForUser, markNotificationRead } = require("../services/notificationService");
const { listSystemLogs, listTimelineForUser } = require("../services/systemLogService");
const { getVehicleProfile } = require("../services/ai/vehicleCompatibilityService");
const Parking = require("../models/parking");
const User = require("../models/user");

async function getPersonalization(req, res) {
  try {
    const vehicleProfile = getVehicleProfile({
      vehicleType: req.query.vehicleType,
      brand: req.query.brand,
      model: req.query.model,
      vehicleSize: req.query.vehicleSize,
    });
    const payload = await buildPersonalizationPayload({
      userId: req.user._id,
      userLocation:
        req.query.lat && req.query.lng
          ? { lat: Number(req.query.lat), lng: Number(req.query.lng) }
          : null,
      carType: req.query.carType || "sedan",
      maxPrice: Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER),
      vehicleProfile,
    });

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function trackSearch(req, res) {
  try {
    const behavior = await recordSearchBehavior({
      userId: req.user._id,
      location: req.body.location || {},
      filters: req.body.filters || {},
      query: req.body.query || "",
    });

    return res.status(201).json({
      preferredLocations: behavior.preferredLocations,
      preferredPriceRange: behavior.preferredPriceRange,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getBehaviorSummary(req, res) {
  try {
    const behavior = await getBehaviorSnapshot(req.user._id);
    return res.json({
      preferredLocations: behavior.preferredLocations,
      preferredPriceRange: behavior.preferredPriceRange,
      bookingHourHistogram: behavior.bookingHourHistogram,
      searches: behavior.searchedLocations.slice(-8).reverse(),
      bookings: behavior.bookedLocations.slice(-8).reverse(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getNotifications(req, res) {
  try {
    const notifications = await listNotificationsForUser(req.user._id);
    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function markRead(req, res) {
  try {
    const notification = await markNotificationRead(req.params.id, req.user._id);
    return res.json(notification);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getFraudOverview(req, res) {
  try {
    const logs = await listFraudLogs();
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getSystemLogs(req, res) {
  try {
    const logs = await listSystemLogs();
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getTimeline(req, res) {
  try {
    const logs = await listTimelineForUser(req.user._id);
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getOnboardingStatus(req, res) {
  try {
    const user = await User.findById(req.user._id).select("onboardingCompleted role");
    return res.json({
      showOnboarding: Boolean(user && user.role === "user" && !user.onboardingCompleted),
      onboardingCompleted: Boolean(user?.onboardingCompleted),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getTrafficRecommendations(req, res) {
  try {
    const vehicleProfile = getVehicleProfile({
      vehicleType: req.query.vehicleType,
      brand: req.query.brand,
      model: req.query.model,
      vehicleSize: req.query.vehicleSize,
    });
    const parkings = await Parking.find({ isActive: true }).lean();
    const payload = await buildTrafficAwareRecommendations({
      parkings,
      userLocation:
        req.query.lat && req.query.lng
          ? { lat: Number(req.query.lat), lng: Number(req.query.lng) }
          : null,
      carType: req.query.carType || "sedan",
      maxPrice: Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER),
      maxDistance: Number(req.query.maxDistance || Number.MAX_SAFE_INTEGER),
      preferredAreas: req.query.preferredAreas
        ? String(req.query.preferredAreas)
            .split(",")
            .map((area) => area.trim())
            .filter(Boolean)
        : [],
      vehicleProfile,
    });

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function completeOnboarding(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { onboardingCompleted: true },
      { new: true }
    ).select("onboardingCompleted");

    return res.json({
      onboardingCompleted: Boolean(user?.onboardingCompleted),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  completeOnboarding,
  getBehaviorSummary,
  getFraudOverview,
  getNotifications,
  getOnboardingStatus,
  getPersonalization,
  getTrafficRecommendations,
  getSystemLogs,
  getTimeline,
  markRead,
  trackSearch,
};
