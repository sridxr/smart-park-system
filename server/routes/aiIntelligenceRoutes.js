const express = require("express");

const { requireAuth } = require("../middleware/auth");
const {
  getCollectiveInsight,
  getDecisionProfile,
  getDecisionReplay,
  getDecisionSwitch,
  getDecisionTree,
  getFutureSimulation,
  getIntentPrediction,
  getSimulation,
  getZeroClickSuggestion,
} = require("../controllers/aiIntelligenceController");

const router = express.Router();

router.use(requireAuth);

router.get("/decision-profile", getDecisionProfile);
router.get("/intent", getIntentPrediction);
router.get("/zero-click", getZeroClickSuggestion);
router.get("/simulate", getSimulation);
router.get("/future-simulate", getFutureSimulation);
router.get("/replay", getDecisionReplay);
router.get("/live-switch", getDecisionSwitch);
router.get("/collective-intelligence", getCollectiveInsight);
router.get("/decision-tree", getDecisionTree);

module.exports = router;
