const express = require("express");

const {
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
} = require("../controllers/aiController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.post("/behavior/search", trackSearch);
router.get("/behavior/summary", getBehaviorSummary);
router.get("/personalization", getPersonalization);
router.get("/traffic/recommendations", getTrafficRecommendations);
router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markRead);
router.get("/timeline", getTimeline);
router.get("/onboarding/status", getOnboardingStatus);
router.post("/onboarding/complete", completeOnboarding);
router.get("/fraud-logs", requireRole("admin"), getFraudOverview);
router.get("/system-logs", requireRole("admin"), getSystemLogs);

module.exports = router;
