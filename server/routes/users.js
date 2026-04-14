const express = require("express");

const User = require("../models/user");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const users = await User.find()
    .sort({ createdAt: -1 })
    .select("-password -verificationToken");

  res.json(users);
});

module.exports = router;
