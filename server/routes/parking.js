const express = require("express");

const Booking = require("../models/Booking");
const Parking = require("../models/parking");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  analyzePeakHours,
  enrichParkingResults,
  getDemandScore,
  getDynamicPricingSuggestion,
  predictDemandLevel,
} = require("../utils/aiEngine");
const {
  activateScheduledBookings,
  releaseCompletedBookings,
  releaseExpiredPendingBookings,
} = require("../services/bookingLifecycleService");
const { emitRealtimeEvent } = require("../realtime/socketServer");
const { buildSlotLayout } = require("../services/slotManagementService");
const { createSystemLog } = require("../services/systemLogService");
const { decorateParkingCollectionWithSensors } = require("../services/iotSimulationService");
const { getVehicleProfile } = require("../services/ai/vehicleCompatibilityService");
const { inferVehicleSize, normalizeVehicleType } = require("../services/vehicleMasterService");

const router = express.Router();

function normalizeTextList(values = []) {
  return Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
}

function normalizeSupportedTypes(values = []) {
  return [
    ...new Set(
      normalizeTextList(values).map(normalizeVehicleType).filter(Boolean)
    ),
  ];
}

function normalizeParkingPayload(body, ownerId) {
  const totalSlots = Number(body.totalSlots || body.availableSlots || 10);
  const availableSlots = Math.min(totalSlots, Number(body.availableSlots || totalSlots || 10));
  const supportedVehicleTypes = normalizeSupportedTypes(
    body.supportedVehicleTypes?.length ? body.supportedVehicleTypes : body.allowedCars
  );
  const supportedBrands = normalizeTextList(body.supportedBrands);
  const supportedModels = normalizeTextList(body.supportedModels);
  const supportedVehicleSizes = [
    ...new Set(
      normalizeTextList(body.supportedVehicleSizes).concat(
        supportedModels.length
          ? supportedModels.map((model) =>
              inferVehicleSize({
                type: supportedVehicleTypes[0],
                model,
              })
            )
          : []
      )
    ),
  ];

  return {
    title: body.title?.trim(),
    description: body.description || "",
    address: {
      fullText: body.address?.fullText || "",
      doorNo: body.address?.doorNo || "",
      apartment: body.address?.apartment || "",
      area: body.address?.area || "",
      landmark: body.address?.landmark || "",
      district: body.address?.district || "",
      state: body.address?.state || "",
      city: body.address?.city || "",
      country: body.address?.country || "India",
      postalCode: body.address?.postalCode || "",
    },
    location: {
      lat: Number(body.location?.lat),
      lng: Number(body.location?.lng),
    },
    timeSlot: {
      start: body.timeSlot?.start || null,
      end: body.timeSlot?.end || null,
    },
    availabilityHours: {
      openTime: body.availabilityHours?.openTime || "06:00",
      closeTime: body.availabilityHours?.closeTime || "23:00",
    },
    fare: Number(body.fare) || 0,
    pricePerHour: Number(body.pricePerHour) || Number(body.fare) || 0,
    dynamicPrice: Number(body.dynamicPrice) || Number(body.fare) || 0,
    parkingSize: body.parkingSize || "small",
    totalSlots,
    availableSlots,
    exitProfile: {
      easeScore: Number(body.exitProfile?.easeScore) || 70,
      laneLabel: body.exitProfile?.laneLabel || "Main exit",
    },
    slotLayout: buildSlotLayout(totalSlots),
    allowedCars: Array.from(new Set(body.allowedCars || [])),
    supportedVehicleTypes: supportedVehicleTypes.length ? supportedVehicleTypes : ["car"],
    supportedBrands,
    supportedModels,
    supportedVehicleSizes,
    amenities: Array.from(new Set(body.amenities || [])),
    tags: Array.from(new Set(body.tags || [])),
    owner: ownerId,
  };
}

function buildOperationalMetrics({ totalSlots, availableSlots, recentBookings }) {
  return {
    occupancyRate: totalSlots
      ? Math.round(((totalSlots - availableSlots) / totalSlots) * 100)
      : 0,
    demandScore: getDemandScore({
      totalSlots,
      availableSlots,
      recentBookings,
    }),
    recentBookings,
  };
}

router.post("/add", requireAuth, requireRole("lender", "admin"), async (req, res) => {
  try {
    const payload = normalizeParkingPayload(req.body, req.user._id);
    payload.liveMetrics = buildOperationalMetrics({
      totalSlots: payload.totalSlots,
      availableSlots: payload.availableSlots,
      recentBookings: 0,
    });
    payload.demandLevel = predictDemandLevel({
      totalSlots: payload.totalSlots,
      availableSlots: payload.availableSlots,
      recentBookings: 0,
    });
    payload.dynamicPrice = getDynamicPricingSuggestion({
      baseFare: payload.fare,
      demandLevel: payload.demandLevel,
      occupancyRate: payload.liveMetrics.occupancyRate,
      recentBookings: 0,
    }).suggestion;

    const parking = await Parking.create(payload);
    await createSystemLog({
      actor: req.user,
      action: "parking.created",
      targetType: "parking",
      targetId: parking._id.toString(),
      description: `Parking listing ${parking.title} was created.`,
    });
    emitRealtimeEvent({
      event: "parking:changed",
      payload: {
        action: "created",
        parkingId: parking._id.toString(),
        ownerId: req.user._id.toString(),
      },
      rooms: ["role:admin", "role:lender", "role:user", `user:${req.user._id.toString()}`],
    });
    res.status(201).json(parking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:parkingId", requireAuth, requireRole("lender", "admin"), async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.parkingId);

    if (!parking) {
      return res.status(404).json({ msg: "Parking asset not found" });
    }

    const isOwner =
      req.user.role === "admin" || parking.owner?.toString?.() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({ msg: "You can only update your own parking assets" });
    }

    const payload = normalizeParkingPayload(req.body, parking.owner || req.user._id);
    const recentBookings = parking.liveMetrics?.recentBookings || 0;
    const liveMetrics = buildOperationalMetrics({
      totalSlots: payload.totalSlots,
      availableSlots: payload.availableSlots,
      recentBookings,
    });
    const demandLevel = predictDemandLevel({
      totalSlots: payload.totalSlots,
      availableSlots: payload.availableSlots,
      recentBookings,
    });

    Object.assign(parking, payload, {
      liveMetrics,
      demandLevel,
      dynamicPrice: getDynamicPricingSuggestion({
        baseFare: payload.fare,
        demandLevel,
        occupancyRate: liveMetrics.occupancyRate,
        recentBookings,
      }).suggestion,
    });

    await parking.save();

    await createSystemLog({
      actor: req.user,
      action: "parking.updated",
      targetType: "parking",
      targetId: parking._id.toString(),
      description: `Parking listing ${parking.title} was updated.`,
    });

    emitRealtimeEvent({
      event: "parking:changed",
      payload: {
        action: "updated",
        parkingId: parking._id.toString(),
        ownerId: parking.owner?.toString?.() || "",
      },
      rooms: [
        "role:admin",
        "role:lender",
        "role:user",
        parking.owner ? `user:${parking.owner.toString()}` : "",
      ],
    });

    return res.json(parking);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/all", async (req, res) => {
  const parkings = await Parking.find({ isActive: true })
    .sort({ createdAt: -1 })
    .populate("owner", "name email role");

  res.json(decorateParkingCollectionWithSensors(parkings.map((parking) => parking.toObject())));
});

router.get("/search", async (req, res) => {
  await releaseExpiredPendingBookings();
  await activateScheduledBookings();
  await releaseCompletedBookings();
  const {
    lat,
    lng,
    carType = "sedan",
    maxPrice = Number.MAX_SAFE_INTEGER,
    maxDistance = Number.MAX_SAFE_INTEGER,
    preferredAreas = "",
    vehicleType = "",
    brand = "",
    model = "",
    vehicleSize = "",
  } = req.query;
  const parkings = await Parking.find({ isActive: true }).lean();
  const enriched = enrichParkingResults(parkings, {
    userLocation: lat && lng ? { lat: Number(lat), lng: Number(lng) } : null,
    carType,
    maxPrice: Number(maxPrice),
    maxDistance: Number(maxDistance),
    preferredAreas: preferredAreas
      ? String(preferredAreas)
          .split(",")
          .map((area) => area.trim())
          .filter(Boolean)
      : [],
    vehicleProfile: getVehicleProfile({
      vehicleType,
      brand,
      model,
      vehicleSize,
    }),
  });
  const filtered = enriched.filter((parking) => {
    if (parking.ai?.distanceKm === null || parking.ai?.distanceKm === undefined) {
      return true;
    }

    return parking.ai.distanceKm <= Number(maxDistance);
  });

  res.json(decorateParkingCollectionWithSensors(filtered));
});

router.get("/mine", requireAuth, requireRole("lender", "admin"), async (req, res) => {
  await releaseExpiredPendingBookings();
  await activateScheduledBookings();
  await releaseCompletedBookings();
  const isAdmin = req.user.role === "admin";
  const parkings = await Parking.find(isAdmin ? {} : { owner: req.user._id }).sort({ createdAt: -1 });
  const bookingRows = await Booking.find(isAdmin ? {} : { lender: req.user._id }).select("parkingId createdAt");
  const peakHours = analyzePeakHours(bookingRows);

  const hydrated = decorateParkingCollectionWithSensors(
    parkings.map((parking) => ({
      ...parking.toObject(),
      peakHours,
    }))
  );

  res.json(hydrated);
});

module.exports = router;
