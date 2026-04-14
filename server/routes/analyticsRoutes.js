const express = require("express");

const {
  getAdminAnalytics,
  getIoTSummary,
} = require("../controllers/analyticsController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/admin", requireRole("admin"), getAdminAnalytics);
router.get("/iot", requireRole("admin", "lender"), getIoTSummary);

module.exports = router;
