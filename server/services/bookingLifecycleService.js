const Booking = require("../models/Booking");
const Parking = require("../models/parking");
const {
  getDemandScore,
  getDynamicPricingSuggestion,
  predictDemandLevel,
} = require("../utils/aiEngine");
const { emitRealtimeEvent } = require("../realtime/socketServer");
const { releaseAssignedSlot } = require("./slotManagementService");

const BOOKING_EXPIRY_MINUTES = 5;

function buildPendingExpiryDate() {
  return new Date(Date.now() + BOOKING_EXPIRY_MINUTES * 60 * 1000);
}

async function releaseExpiredPendingBookings() {
  const expiredBookings = await Booking.find({
    status: "pending",
    paymentStatus: "created",
    expiresAt: { $lte: new Date() },
  });

  for (const booking of expiredBookings) {
    const parking = await Parking.findById(booking.parkingId);
    let updatedAvailableSlots = null;

    if (parking && booking.slotActivated) {
      const nextAvailableSlots = Math.min(
        parking.totalSlots,
        (parking.availableSlots || 0) + 1
      );
      const nextRecentBookings = Math.max(
        0,
        (parking.liveMetrics?.recentBookings || 0) - 1
      );
      const nextDemandLevel = predictDemandLevel({
        totalSlots: parking.totalSlots,
        availableSlots: nextAvailableSlots,
        recentBookings: nextRecentBookings,
      });
      const nextDemandScore = getDemandScore({
        totalSlots: parking.totalSlots,
        availableSlots: nextAvailableSlots,
        recentBookings: nextRecentBookings,
      });
      const nextOccupancyRate = parking.totalSlots
        ? Math.round(
            ((parking.totalSlots - nextAvailableSlots) / parking.totalSlots) * 100
          )
        : 0;
      const slotLayout = releaseAssignedSlot(parking, booking.assignedSlotCode);
      updatedAvailableSlots = nextAvailableSlots;

      await Parking.findByIdAndUpdate(parking._id, {
        $set: {
          availableSlots: nextAvailableSlots,
          slotLayout,
          demandLevel: nextDemandLevel,
          "liveMetrics.recentBookings": nextRecentBookings,
          "liveMetrics.occupancyRate": nextOccupancyRate,
          "liveMetrics.demandScore": nextDemandScore,
          dynamicPrice: getDynamicPricingSuggestion({
            baseFare: parking.fare,
            demandLevel: nextDemandLevel,
            occupancyRate: nextOccupancyRate,
            recentBookings: nextRecentBookings,
          }).suggestion,
        },
      });
    }

    booking.status = "cancelled";
    booking.paymentStatus = "failed";
    booking.slotActivated = false;
    booking.expiresAt = null;
    await booking.save();

    emitRealtimeEvent({
      event: "booking:changed",
      payload: {
        action: "expired",
        bookingId: booking._id.toString(),
        parkingId: booking.parkingId?.toString?.() || "",
        userId: booking.user?.toString?.() || "",
        lenderId: booking.lender?.toString?.() || "",
      },
      rooms: [
        "role:admin",
        "role:user",
        booking.user ? `user:${booking.user.toString()}` : "",
        booking.lender ? `user:${booking.lender.toString()}` : "",
      ],
    });

    emitRealtimeEvent({
      event: "parking:changed",
      payload: {
        action: "slot-released",
        parkingId: booking.parkingId?.toString?.() || "",
        availableSlots: updatedAvailableSlots,
      },
      rooms: ["role:admin", "role:user", "role:lender"],
    });
  }

  return expiredBookings.length;
}

async function releaseCompletedBookings() {
  const completedBookings = await Booking.find({
    status: "confirmed",
    slotActivated: true,
    endTime: { $lte: new Date() },
  });

  for (const booking of completedBookings) {
    const parking = await Parking.findById(booking.parkingId);
    let updatedAvailableSlots = null;

    if (parking) {
      const nextAvailableSlots = Math.min(
        parking.totalSlots,
        (parking.availableSlots || 0) + 1
      );
      const nextRecentBookings = Math.max(
        0,
        (parking.liveMetrics?.recentBookings || 0) - 1
      );
      const nextDemandLevel = predictDemandLevel({
        totalSlots: parking.totalSlots,
        availableSlots: nextAvailableSlots,
        recentBookings: nextRecentBookings,
      });
      const nextDemandScore = getDemandScore({
        totalSlots: parking.totalSlots,
        availableSlots: nextAvailableSlots,
        recentBookings: nextRecentBookings,
      });
      const nextOccupancyRate = parking.totalSlots
        ? Math.round(
            ((parking.totalSlots - nextAvailableSlots) / parking.totalSlots) * 100
          )
        : 0;
      const slotLayout = releaseAssignedSlot(parking, booking.assignedSlotCode);
      updatedAvailableSlots = nextAvailableSlots;

      await Parking.findByIdAndUpdate(parking._id, {
        $set: {
          availableSlots: nextAvailableSlots,
          slotLayout,
          demandLevel: nextDemandLevel,
          "liveMetrics.recentBookings": nextRecentBookings,
          "liveMetrics.occupancyRate": nextOccupancyRate,
          "liveMetrics.demandScore": nextDemandScore,
          dynamicPrice: getDynamicPricingSuggestion({
            baseFare: parking.fare,
            demandLevel: nextDemandLevel,
            occupancyRate: nextOccupancyRate,
            recentBookings: nextRecentBookings,
          }).suggestion,
        },
      });
    }

    booking.status = "completed";
    await booking.save();

    emitRealtimeEvent({
      event: "booking:changed",
      payload: {
        action: "completed",
        bookingId: booking._id.toString(),
        parkingId: booking.parkingId?.toString?.() || "",
        userId: booking.user?.toString?.() || "",
        lenderId: booking.lender?.toString?.() || "",
      },
      rooms: [
        "role:admin",
        "role:user",
        booking.user ? `user:${booking.user.toString()}` : "",
        booking.lender ? `user:${booking.lender.toString()}` : "",
      ],
    });

    emitRealtimeEvent({
      event: "parking:changed",
      payload: {
        action: "slot-completed",
        parkingId: booking.parkingId?.toString?.() || "",
        availableSlots: updatedAvailableSlots,
      },
      rooms: ["role:admin", "role:user", "role:lender"],
    });
  }

  return completedBookings.length;
}

async function activateScheduledBookings() {
  const bookingsToActivate = await Booking.find({
    status: "confirmed",
    slotActivated: false,
    startTime: { $lte: new Date() },
    endTime: { $gt: new Date() },
  });

  for (const booking of bookingsToActivate) {
    const parking = await Parking.findById(booking.parkingId);

    if (!parking) {
      continue;
    }

    const nextAvailableSlots = Math.max(0, (parking.availableSlots || 0) - 1);
    const nextRecentBookings = (parking.liveMetrics?.recentBookings || 0) + 1;
    const nextDemandLevel = predictDemandLevel({
      totalSlots: parking.totalSlots,
      availableSlots: nextAvailableSlots,
      recentBookings: nextRecentBookings,
    });
    const nextDemandScore = getDemandScore({
      totalSlots: parking.totalSlots,
      availableSlots: nextAvailableSlots,
      recentBookings: nextRecentBookings,
    });
    const nextOccupancyRate = parking.totalSlots
      ? Math.round(
          ((parking.totalSlots - nextAvailableSlots) / parking.totalSlots) * 100
        )
      : 0;
    const slotLayout = ensureActiveAssignedSlot(parking, booking.assignedSlotCode);

    await Parking.findByIdAndUpdate(parking._id, {
      $set: {
        availableSlots: nextAvailableSlots,
        slotLayout,
        demandLevel: nextDemandLevel,
        "liveMetrics.recentBookings": nextRecentBookings,
        "liveMetrics.occupancyRate": nextOccupancyRate,
        "liveMetrics.demandScore": nextDemandScore,
        dynamicPrice: getDynamicPricingSuggestion({
          baseFare: parking.fare,
          demandLevel: nextDemandLevel,
          occupancyRate: nextOccupancyRate,
          recentBookings: nextRecentBookings,
        }).suggestion,
      },
    });

    booking.slotActivated = true;
    await booking.save();

    emitRealtimeEvent({
      event: "parking:changed",
      payload: {
        action: "slot-activated",
        parkingId: booking.parkingId?.toString?.() || "",
        availableSlots: nextAvailableSlots,
      },
      rooms: ["role:admin", "role:user", "role:lender"],
    });
  }

  return bookingsToActivate.length;
}

function ensureActiveAssignedSlot(parking, assignedSlotCode) {
  if (!assignedSlotCode) {
    return parking.slotLayout;
  }

  const slotLayout = parking.slotLayout || { rows: 0, columns: 0, slots: [] };
  const slots = (slotLayout.slots || []).map((slot) =>
    slot.code === assignedSlotCode
      ? {
          ...slot,
          status: "occupied",
          occupied: true,
          sensorStatus: "online",
          sensorUpdatedAt: new Date(),
        }
      : slot
  );

  return {
    ...slotLayout,
    slots,
  };
}

module.exports = {
  activateScheduledBookings,
  BOOKING_EXPIRY_MINUTES,
  buildPendingExpiryDate,
  releaseCompletedBookings,
  releaseExpiredPendingBookings,
};
