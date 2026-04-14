const express = require("express");

const { requireAuth, requireRole } = require("../middleware/auth");
const {
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
} = require("../controllers/tripController");

const router = express.Router();

router.use(requireAuth);

router.get("/state", requireRole("user"), getTripState);
router.post("/start", requireRole("user"), startTripSession);
router.post("/:tripId/location", requireRole("user"), reportLocation);
router.post("/:tripId/status", requireRole("user"), updateTripProgress);
router.post("/:tripId/extend", requireRole("user"), extendTripTime);
router.post("/:tripId/complete", requireRole("user"), finishTrip);
router.get("/:tripId/billing", requireRole("user"), getTripBillingState);
router.post("/:tripId/review", requireRole("user"), addReview);
router.get("/lender/performance", requireRole("lender", "admin"), getLenderPerformance);
router.get("/admin/summary", requireRole("admin"), getAdminTripSummary);

module.exports = router;
