const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { search, status } = require("../controllers/platformController");

const router = express.Router();

router.use(requireAuth);

router.get("/status", status);
router.get("/search", search);

module.exports = router;
