const express = require("express");

const { requireAuth, requireRole } = require("../middleware/auth");
const { createSavedLocation, listSavedLocations, removeSavedLocation } = require("../controllers/locationController");

const router = express.Router();

router.use(requireAuth, requireRole("user"));
router.get("/", listSavedLocations);
router.post("/", createSavedLocation);
router.delete("/:locationId", removeSavedLocation);

module.exports = router;
