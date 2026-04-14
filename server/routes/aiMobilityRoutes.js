const express = require("express");

const { requireAuth, requireRole } = require("../middleware/auth");
const { getLenderForecast, getMobilityInsights } = require("../controllers/aiMobilityController");

const router = express.Router();

router.use(requireAuth);
router.get("/insights", requireRole("user"), getMobilityInsights);
router.get("/forecast/lender", requireRole("lender", "admin"), getLenderForecast);

module.exports = router;
