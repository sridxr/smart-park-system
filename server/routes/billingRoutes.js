const express = require("express");

const { requireAuth, requireRole } = require("../middleware/auth");
const { getCurrentBilling } = require("../controllers/billingController");

const router = express.Router();

router.use(requireAuth);
router.get("/current", requireRole("user"), getCurrentBilling);

module.exports = router;
