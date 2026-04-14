const Booking = require("../models/Booking");
const Parking = require("../models/parking");
const User = require("../models/user");
const {
  getDemandScore,
  getDynamicPricingSuggestion,
  predictDemandLevel,
} = require("../utils/aiEngine");
const { buildPendingExpiryDate } = require("./bookingLifecycleService");
const { ensureSlotLayout } = require("./slotManagementService");
const {
  calculateBookingAmount,
  findAvailableSlotForWindow,
  isActiveWindow,
  isTimeWithinAvailability,
  normalizeBookingWindow,
} = require("./bookingScheduleService");

class BookingAutomationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "BookingAutomationError";
    this.statusCode = statusCode;
  }
}

function computeParkingState(parking, availableSlots, recentBookings) {
  const demandLevel = predictDemandLevel({
    totalSlots: parking.totalSlots,
    availableSlots,
    recentBookings,
  });
  const occupancyRate = parking.totalSlots
    ? Math.round(((parking.totalSlots - availableSlots) / parking.totalSlots) * 100)
    : 0;
  const demandScore = getDemandScore({
    totalSlots: parking.totalSlots,
    availableSlots,
    recentBookings,
  });
  const dynamicPrice = getDynamicPricingSuggestion({
    baseFare: parking.fare,
    demandLevel,
    occupancyRate,
    recentBookings,
  }).suggestion;

  return {
    demandLevel,
    occupancyRate,
    demandScore,
    dynamicPrice,
  };
}

async function reservePendingBooking({
  user,
  parkingId,
  orderId,
  amount = null,
  schedule = {},
  vehicleSnapshot = null,
}) {
  const parking = await Parking.findOne({
    _id: parkingId,
    isActive: true,
    availableSlots: { $gt: 0 },
  });

  if (!parking) {
    throw new BookingAutomationError("Slot already booked", 409);
  }

  const windowDetails = normalizeBookingWindow(schedule);

  if (!isTimeWithinAvailability(windowDetails, parking)) {
    throw new BookingAutomationError("Selected time is outside lender availability hours", 400);
  }

  const slotLayout = ensureSlotLayout(parking);
  const slotSelection = await findAvailableSlotForWindow(parking, windowDetails);
  const bestSlot = slotSelection.assignedSlot;

  if (!bestSlot) {
    throw new BookingAutomationError("Slot already booked", 409);
  }

  const updatedSlots = slotLayout.slots.map((slot) =>
    slot.code === bestSlot.code
      ? {
          ...slot,
          status: "occupied",
          occupied: true,
          sensorStatus: "online",
          sensorUpdatedAt: new Date(),
        }
      : slot
  );
  const simulatedSlotLayout = {
    ...slotLayout,
    slots: updatedSlots,
  };
  const nextState = computeParkingState(
    parking,
    Math.max(0, (parking.availableSlots || 0) - 1),
    (parking.liveMetrics?.recentBookings || 0) + 1
  );

  const booking = await Booking.create({
    user: user._id,
    userEmail: user.email,
    lender: parking.owner || null,
    parkingId: parking._id,
    parkingTitle: parking.title,
    amount: amount ?? calculateBookingAmount(parking, windowDetails),
    paymentStatus: "created",
    orderId,
    status: "pending",
    assignedSlotCode: bestSlot.code,
    startTime: windowDetails.startTime,
    endTime: windowDetails.endTime,
    duration: windowDetails.duration,
    vehicleSnapshot,
    slotActivated: false,
    expiresAt: buildPendingExpiryDate(),
    demandAtBooking: nextState.demandLevel,
  });

  return {
    booking,
    parking,
    assignedSlotCode: bestSlot.code,
    windowDetails,
    slotLayout: simulatedSlotLayout,
  };
}

async function confirmPendingBooking({ user, parkingId, orderId, paymentId }) {
  const booking = await Booking.findOne({
    user: user._id,
    parkingId,
    orderId,
    status: "pending",
    paymentStatus: "created",
    expiresAt: { $gt: new Date() },
  });

  if (!booking) {
    throw new BookingAutomationError("Pending booking not found or already expired", 404);
  }

  booking.status = "confirmed";
  booking.paymentStatus = "success";
  booking.paymentId = paymentId;
  booking.expiresAt = null;
  booking.slotActivated = isActiveWindow({
    startTime: booking.startTime,
    endTime: booking.endTime,
  });
  await booking.save();

  const parking = await Parking.findById(parkingId);

  if (parking && booking.slotActivated) {
    const nextAvailableSlots = Math.max(0, (parking.availableSlots || 0) - 1);
    const nextRecentBookings = (parking.liveMetrics?.recentBookings || 0) + 1;
    const nextState = computeParkingState(parking, nextAvailableSlots, nextRecentBookings);
    const slotLayout = ensureSlotLayout(parking);

    await Parking.findByIdAndUpdate(parking._id, {
      $set: {
        availableSlots: nextAvailableSlots,
        slotLayout: {
          ...slotLayout,
          slots: slotLayout.slots.map((slot) =>
            slot.code === booking.assignedSlotCode
              ? {
                  ...slot,
                  status: "occupied",
                  occupied: true,
                  sensorStatus: "online",
                  sensorUpdatedAt: new Date(),
                }
              : slot
          ),
        },
        demandLevel: nextState.demandLevel,
        dynamicPrice: nextState.dynamicPrice,
        "liveMetrics.recentBookings": nextRecentBookings,
        "liveMetrics.occupancyRate": nextState.occupancyRate,
        "liveMetrics.demandScore": nextState.demandScore,
      },
    });
  }

  if (parking?.owner) {
    await User.findByIdAndUpdate(parking.owner, {
      $inc: {
        revenue: booking.amount || 0,
        totalBookings: 1,
      },
    });
  }

  return {
    booking,
    parking,
  };
}

module.exports = {
  BookingAutomationError,
  confirmPendingBooking,
  reservePendingBooking,
};
