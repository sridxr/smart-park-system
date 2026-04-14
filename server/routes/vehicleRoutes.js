const express = require("express");

const { requireAuth, requireRole } = require("../middleware/auth");
const {
  createVehicle,
  listLenderVehicleSupport,
  listVehicleMasterCatalog,
  listVehicles,
  removeVehicle,
} = require("../controllers/vehicleController");

const router = express.Router();

router.use(requireAuth);
router.get("/master", listVehicleMasterCatalog);
router.get("/lender", requireRole("lender", "admin"), listLenderVehicleSupport);
router.get("/user", requireRole("user"), listVehicles);
router.post("/user", requireRole("user"), createVehicle);
router.delete("/user/:vehicleId", requireRole("user"), removeVehicle);
router.get("/", requireRole("user"), listVehicles);
router.post("/", requireRole("user"), createVehicle);
router.delete("/:vehicleId", requireRole("user"), removeVehicle);

module.exports = router;
