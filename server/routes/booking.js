const express = require("express");
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Parking = require("../models/parking");
const User = require("../models/user");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  getDemandScore,
  getDynamicPricingSuggestion,
  predictDemandLevel,
} = require("../utils/aiEngine");
const {
  buildLenderInsights,
  buildDemandZones,
} = require("../services/analyticsService");
const {
  activateScheduledBookings,
  releaseCompletedBookings,
  releaseExpiredPendingBookings,
} = require("../services/bookingLifecycleService");
const {
  assignNextAvailableSlot,
  ensureSlotLayout,
} = require("../services/slotManagementService");
const {
  buildTimeOverlapQuery,
  calculateBookingAmount,
  findAvailableSlotForWindow,
  getAvailabilityPreview,
  isActiveWindow,
  normalizeBookingWindow,
} = require("../services/bookingScheduleService");
const {
  BookingAutomationError,
  confirmPendingBooking,
  reservePendingBooking,
} = require("../services/bookingAutomationService");
const {
  SIMULATED_GATEWAY_NAME,
  buildSimulatedOrder,
  buildSimulatedPayment,
} = require("../services/paymentSimulationService");
const { recordBookingBehavior } = require("../services/behaviorTrackingService");
const { evaluateFraudSignals } = require("../services/ai/fraudDetectionService");
const {
  notifyBookingConfirmed,
  notifyParkingPressure,
} = require("../services/notificationService");
const { createSystemLog } = require("../services/systemLogService");
const { emitRealtimeEvent } = require("../realtime/socketServer");
const { resolveVehicleSelection } = require("../services/vehicleSelectionService");

const router = express.Router();

function getBookingAmount(parking, windowDetails = null) {
  if (windowDetails) {
    return calculateBookingAmount(parking, windowDetails);
  }
  return Number(parking.pricePerHour || parking.dynamicPrice || parking.fare) || 0;
}

async function finalizeBooking({
  user,
  parking,
  amount,
  windowDetails = null,
  orderId = "",
  paymentId = "",
  paymentStatus = "success",
  status = "confirmed",
  expiresAt = null,
  vehicleSnapshot = null,
}) {
  const hydratedParking = parking.toObject ? parking.toObject() : parking;
  let assignedSlotCode = "";
  let slotLayout = ensureSlotLayout(hydratedParking);

  if (windowDetails) {
    const slotSelection = await findAvailableSlotForWindow(parking, windowDetails);
    assignedSlotCode = slotSelection.assignedSlot?.code || "";
    slotLayout = {
      ...slotLayout,
      slots: slotLayout.slots.map((slot) =>
        slot.code === assignedSlotCode
          ? {
              ...slot,
              status: "occupied",
              occupied: true,
              sensorStatus: "online",
              sensorUpdatedAt: new Date(),
            }
          : slot
      ),
    };
  } else {
    const assigned = assignNextAvailableSlot(hydratedParking);
    assignedSlotCode = assigned.assignedSlotCode || "";
    slotLayout = assigned.slotLayout;
  }

  if (!assignedSlotCode) {
    throw new BookingAutomationError("Slot already booked", 409);
  }

  const slotAlreadyBooked = await Booking.exists({
    ...(windowDetails
      ? buildTimeOverlapQuery(parking._id, windowDetails)
      : {
          parkingId: parking._id,
          status: { $in: ["pending", "confirmed"] },
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        }),
    assignedSlotCode,
  });

  if (slotAlreadyBooked) {
    throw new BookingAutomationError("Slot already booked", 409);
  }

  const nextAvailableSlots = Math.max(0, (parking.availableSlots || 0) - 1);
  const nextRecentBookings = (parking.liveMetrics?.recentBookings || 0) + 1;
  const demandLevel = predictDemandLevel({
    totalSlots: parking.totalSlots,
    availableSlots: nextAvailableSlots,
    recentBookings: nextRecentBookings,
  });
  const nextOccupancyRate = parking.totalSlots
    ? Math.round(((parking.totalSlots - nextAvailableSlots) / parking.totalSlots) * 100)
    : 0;
  const demandScore = getDemandScore({
    totalSlots: parking.totalSlots,
    availableSlots: nextAvailableSlots,
    recentBookings: nextRecentBookings,
  });

  const booking = await Booking.create({
    user: user._id,
    userEmail: user.email,
    lender: parking.owner || null,
    parkingId: parking._id,
    parkingTitle: parking.title,
    amount,
    paymentStatus,
    paymentId,
    orderId,
    status,
    assignedSlotCode: assignedSlotCode || "",
    startTime: windowDetails?.startTime || null,
    endTime: windowDetails?.endTime || null,
    duration: windowDetails?.duration || 1,
    vehicleSnapshot,
    slotActivated: windowDetails ? isActiveWindow(windowDetails) : true,
    expiresAt,
    demandAtBooking: demandLevel,
  });

  if (booking.slotActivated) {
    await Parking.findByIdAndUpdate(parking._id, {
      $set: {
        availableSlots: nextAvailableSlots,
        slotLayout: slotLayout || ensureSlotLayout(hydratedParking),
        demandLevel,
        "liveMetrics.recentBookings": nextRecentBookings,
        "liveMetrics.occupancyRate": nextOccupancyRate,
        "liveMetrics.demandScore": demandScore,
        dynamicPrice: getDynamicPricingSuggestion({
          baseFare: parking.fare,
          demandLevel,
          occupancyRate: nextOccupancyRate,
          recentBookings: nextRecentBookings,
        }).suggestion,
      },
    });
  }

  if (parking.owner) {
    await User.findByIdAndUpdate(parking.owner, {
      $inc: {
        revenue: amount,
        totalBookings: 1,
      },
    });
  }

  await Promise.all([
    recordBookingBehavior({
      userId: user._id,
      parking,
      amount,
    }),
    notifyBookingConfirmed({
      userId: user._id,
      lenderId: parking.owner || null,
      parkingTitle: parking.title,
      amount,
    }),
    createSystemLog({
      actor: user,
      action: "booking.confirmed",
      targetType: "booking",
      targetId: booking._id.toString(),
      description: `Booking confirmed for ${parking.title}.`,
      metadata: {
        parkingId: parking._id.toString(),
        amount,
      },
    }),
  ]);

  await evaluateFraudSignals(user._id);

  if (nextAvailableSlots <= 2 && parking.owner) {
    await notifyParkingPressure({
      lenderId: parking.owner,
      parkingTitle: parking.title,
      availableSlots: nextAvailableSlots,
    });
  }

  emitRealtimeEvent({
    event: "booking:changed",
    payload: {
      action: status,
      bookingId: booking._id.toString(),
      parkingId: parking._id.toString(),
      userId: user._id.toString(),
      lenderId: parking.owner?.toString?.() || "",
    },
    rooms: [
      "role:admin",
      "role:user",
      `user:${user._id.toString()}`,
      parking.owner ? `user:${parking.owner.toString()}` : "",
    ],
  });

  emitRealtimeEvent({
    event: "parking:changed",
    payload: {
      action: "availability-updated",
      parkingId: parking._id.toString(),
      availableSlots: booking.slotActivated ? nextAvailableSlots : parking.availableSlots,
      demandLevel,
    },
    rooms: ["role:admin", "role:user", "role:lender"],
  });

  return Booking.findById(booking._id).populate(
    "parkingId",
    "title address fare parkingSize slotLayout exitProfile"
  );
}

router.post("/create", requireAuth, requireRole("user"), async (req, res) => {
  try {
    await releaseExpiredPendingBookings();
    await activateScheduledBookings();
    await releaseCompletedBookings();
    const { parkingId } = req.body;
    const windowDetails = normalizeBookingWindow(req.body);
    const vehicleSnapshot = await resolveVehicleSelection({
      userId: req.user._id,
      vehicleId: req.body.vehicleId,
      fallbackVehicle: req.body.vehicle,
    });

    if (!mongoose.Types.ObjectId.isValid(parkingId)) {
      return res.status(400).json({ msg: "A valid parking slot is required" });
    }

    const parking = await Parking.findOne({
      _id: parkingId,
      isActive: true,
      availableSlots: { $gt: 0 },
    });

    if (!parking) {
      return res.status(400).json({ msg: "This parking slot is currently full" });
    }

    const amount = getBookingAmount(parking, windowDetails);
    const simulatedOrder = buildSimulatedOrder({
      user: req.user,
      parking,
      amount,
    });
    const simulatedPayment = buildSimulatedPayment({
      orderId: simulatedOrder.id,
    });

    const booking = await finalizeBooking({
      user: req.user,
      parking,
      amount,
      windowDetails,
      orderId: simulatedOrder.id,
      paymentId: simulatedPayment.paymentId,
      paymentStatus: "success",
      status: "confirmed",
      vehicleSnapshot,
    });

    return res.status(201).json({
      msg: "Payment successful and booking confirmed",
      booking,
      payment: simulatedPayment,
      order: simulatedOrder,
    });
  } catch (err) {
    if (err instanceof BookingAutomationError) {
      return res.status(err.statusCode).json({ msg: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

router.post("/payment/order", requireAuth, requireRole("user"), async (req, res) => {
  try {
    await releaseExpiredPendingBookings();
    await activateScheduledBookings();
    await releaseCompletedBookings();
    const windowDetails = normalizeBookingWindow(req.body);
    const vehicleSnapshot = await resolveVehicleSelection({
      userId: req.user._id,
      vehicleId: req.body.vehicleId,
      fallbackVehicle: req.body.vehicle,
    });
    const parking = await Parking.findOne({
      _id: req.body.parkingId,
      isActive: true,
      availableSlots: { $gt: 0 },
    });

    if (!parking) {
      return res.status(400).json({ msg: "Parking slot is no longer available" });
    }

    const amount = getBookingAmount(parking, windowDetails);
    const order = buildSimulatedOrder({
      user: req.user,
      parking,
      amount,
    });
    const reservation = await reservePendingBooking({
      user: req.user,
      parkingId: parking._id,
      orderId: order.id,
      amount,
      schedule: req.body,
      vehicleSnapshot,
    });

    emitRealtimeEvent({
      event: "booking:changed",
      payload: {
        action: "pending",
        bookingId: reservation.booking._id.toString(),
        parkingId: parking._id.toString(),
        userId: req.user._id.toString(),
      },
      rooms: ["role:admin", "role:user", `user:${req.user._id.toString()}`],
    });

    emitRealtimeEvent({
      event: "parking:changed",
      payload: {
        action: "availability-held",
        parkingId: parking._id.toString(),
        availableSlots: isActiveWindow(reservation.windowDetails)
          ? Math.max(0, (parking.availableSlots || 0) - 1)
          : parking.availableSlots,
      },
      rooms: ["role:admin", "role:user", "role:lender"],
    });

    return res.json({
      order,
      parking,
      reservation,
      bookingWindow: windowDetails,
      simulated: true,
      gateway: SIMULATED_GATEWAY_NAME,
    });
  } catch (err) {
    if (err instanceof BookingAutomationError) {
      return res.status(err.statusCode).json({ msg: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

router.post("/payment/verify", requireAuth, requireRole("user"), async (req, res) => {
  try {
    await releaseExpiredPendingBookings();
    await activateScheduledBookings();
    await releaseCompletedBookings();
    const { parkingId, orderId = "" } = req.body;
    const windowDetails = normalizeBookingWindow(req.body);
    const vehicleSnapshot = await resolveVehicleSelection({
      userId: req.user._id,
      vehicleId: req.body.vehicleId,
      fallbackVehicle: req.body.vehicle,
    });

    const parking = await Parking.findOne({
      _id: parkingId,
      isActive: true,
    });

    if (!parking) {
      return res.status(400).json({ msg: "Parking slot is no longer available" });
    }

    const simulatedPayment = buildSimulatedPayment({
      orderId,
    });

    let booking = null;

    try {
      const confirmation = await confirmPendingBooking({
        user: req.user,
        parkingId,
        orderId: simulatedPayment.orderId,
        paymentId: simulatedPayment.paymentId,
      });
      booking = await Booking.findById(confirmation.booking._id).populate(
        "parkingId",
        "title address fare parkingSize slotLayout exitProfile"
      );
      await Promise.all([
        recordBookingBehavior({
          userId: req.user._id,
          parking: confirmation.parking || parking,
          amount: booking.amount || getBookingAmount(parking, windowDetails),
        }),
        notifyBookingConfirmed({
          userId: req.user._id,
          lenderId: confirmation.parking?.owner || parking.owner || null,
          parkingTitle: booking.parkingTitle,
          amount: booking.amount || getBookingAmount(parking, windowDetails),
        }),
        createSystemLog({
          actor: req.user,
          action: "booking.confirmed",
          targetType: "booking",
          targetId: booking._id.toString(),
          description: `Booking confirmed for ${booking.parkingTitle}.`,
          metadata: {
            parkingId: booking.parkingId?._id?.toString?.() || parkingId,
            amount: booking.amount || getBookingAmount(parking, windowDetails),
          },
        }),
      ]);
      await evaluateFraudSignals(req.user._id);
      emitRealtimeEvent({
        event: "booking:changed",
        payload: {
          action: "confirmed",
          bookingId: booking._id.toString(),
          parkingId: booking.parkingId?._id?.toString?.() || parkingId,
          userId: req.user._id.toString(),
          lenderId: confirmation.parking?.owner?.toString?.() || parking.owner?.toString?.() || "",
        },
        rooms: [
          "role:admin",
          "role:user",
          `user:${req.user._id.toString()}`,
          confirmation.parking?.owner ? `user:${confirmation.parking.owner.toString()}` : "",
        ],
      });
      emitRealtimeEvent({
        event: "parking:changed",
        payload: {
          action: confirmation.booking.slotActivated ? "availability-updated" : "future-booking-confirmed",
          parkingId: booking.parkingId?._id?.toString?.() || parkingId,
          availableSlots: confirmation.booking.slotActivated
            ? Math.max(0, (confirmation.parking?.availableSlots || 0) - 1)
            : confirmation.parking?.availableSlots,
        },
        rooms: ["role:admin", "role:user", "role:lender"],
      });
    } catch (automationErr) {
      if (!(automationErr instanceof BookingAutomationError) || automationErr.statusCode !== 404) {
        throw automationErr;
      }

      if (!parking?.availableSlots) {
        throw new BookingAutomationError("Slot already booked", 409);
      }

      booking = await finalizeBooking({
        user: req.user,
        parking,
        amount: getBookingAmount(parking, windowDetails),
        windowDetails,
        orderId: simulatedPayment.orderId,
        paymentId: simulatedPayment.paymentId,
        paymentStatus: "success",
        status: "confirmed",
        vehicleSnapshot,
      });
    }

    return res.json({
      msg: "Simulated payment verified and booking confirmed",
      booking,
      payment: simulatedPayment,
    });
  } catch (err) {
    if (err instanceof BookingAutomationError) {
      return res.status(err.statusCode).json({ msg: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

router.get("/availability", requireAuth, async (req, res) => {
  try {
    await releaseExpiredPendingBookings();
    await activateScheduledBookings();
    await releaseCompletedBookings();
    const { parkingId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(parkingId)) {
      return res.status(400).json({ msg: "A valid parking slot is required" });
    }

    const parking = await Parking.findById(parkingId).lean();

    if (!parking || !parking.isActive) {
      return res.status(404).json({ msg: "Parking not found" });
    }

    const windowDetails = normalizeBookingWindow(req.query);
    const preview = await getAvailabilityPreview(parking, windowDetails);

    return res.json({
      ...preview,
      startTime: windowDetails.startTime,
      endTime: windowDetails.endTime,
      duration: windowDetails.duration,
    });
  } catch (err) {
    if (err instanceof BookingAutomationError) {
      return res.status(err.statusCode).json({ msg: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  try {
    await releaseExpiredPendingBookings();
    await activateScheduledBookings();
    await releaseCompletedBookings();
    const query =
      req.user.role === "lender"
        ? { lender: req.user._id }
        : req.user.role === "admin"
        ? {}
        : { user: req.user._id };

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate("parkingId", "title address fare parkingSize");

    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/hotspots", requireAuth, async (req, res) => {
  try {
    await releaseExpiredPendingBookings();
    await activateScheduledBookings();
    await releaseCompletedBookings();
    const hotspots = await Booking.aggregate([
      {
        $group: {
          _id: "$parkingId",
          parkingTitle: { $first: "$parkingTitle" },
          totalBookings: { $sum: 1 },
          avgFare: { $avg: "$amount" },
        },
      },
      { $sort: { totalBookings: -1 } },
      { $limit: 5 },
    ]);

    return res.json(hotspots);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/summary/lender", requireAuth, requireRole("lender", "admin"), async (req, res) => {
  try {
    await releaseExpiredPendingBookings();
    await activateScheduledBookings();
    await releaseCompletedBookings();
    const match = req.user.role === "admin" ? {} : { lender: req.user._id };
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [summary, bookingsToday, bookings, parkings] = await Promise.all([
      Booking.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            revenue: { $sum: "$amount" },
          },
        },
      ]),
      Booking.countDocuments({
        ...match,
        createdAt: { $gte: startOfDay },
      }),
      Booking.find(match).sort({ createdAt: -1 }).limit(100),
      Parking.find(req.user.role === "admin" ? {} : { owner: req.user._id }).lean(),
    ]);
    const intelligence = buildLenderInsights({ listings: parkings, bookings });
    const alerts = buildDemandZones(bookings).slice(0, 3).map((zone) => ({
      title: zone.location,
      message: `${zone.bookings} recent bookings generated Rs. ${zone.revenue}.`,
    }));

    return res.json({
      totalBookings: summary[0]?.totalBookings || 0,
      revenue: summary[0]?.revenue || 0,
      bookingsToday,
      revenueSeries: intelligence.revenueSeries,
      bookingSeries: intelligence.bookingSeries,
      insights: intelligence.insights,
      alerts,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/by-date", requireAuth, requireRole("lender", "admin"), async (req, res) => {
  try {
    await releaseExpiredPendingBookings();
    await activateScheduledBookings();
    await releaseCompletedBookings();
    const selectedDate = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const match = {
      ...(req.user.role === "admin" ? {} : { lender: req.user._id }),
    };

    const bookings = await Booking.find({
      ...match,
      $or: [
        { startTime: { $gte: startOfDay, $lt: endOfDay } },
        {
          startTime: null,
          createdAt: { $gte: startOfDay, $lt: endOfDay },
        },
      ],
    })
      .sort({ startTime: 1, createdAt: 1 })
      .populate("parkingId", "title address availabilityHours pricePerHour");

    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
