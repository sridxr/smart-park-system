const Booking = require("../models/Booking");
const { ensureSlotLayout } = require("./slotManagementService");

const DEFAULT_DURATION_HOURS = 1;

function roundHours(value) {
  return Math.max(0.5, Math.round(Number(value || DEFAULT_DURATION_HOURS) * 2) / 2);
}

function buildDateTime(dateInput, timeInput) {
  const baseDate = dateInput ? new Date(dateInput) : new Date();
  const safeDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const timeValue = typeof timeInput === "string" && timeInput.includes(":") ? timeInput : "09:00";
  const [hours, minutes] = timeValue.split(":").map((value) => Number.parseInt(value, 10));
  const nextDate = new Date(safeDate);
  nextDate.setHours(Number.isNaN(hours) ? 9 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
  return nextDate;
}

function normalizeBookingWindow(payload = {}) {
  const startTime = payload.startTime
    ? new Date(payload.startTime)
    : buildDateTime(payload.date, payload.startClockTime || payload.startTimeValue);
  const safeStartTime = Number.isNaN(startTime.getTime()) ? new Date() : startTime;

  let endTime = payload.endTime ? new Date(payload.endTime) : null;
  const duration = roundHours(
    payload.duration ||
      (endTime && !Number.isNaN(endTime.getTime())
        ? (endTime.getTime() - safeStartTime.getTime()) / (60 * 60 * 1000)
        : DEFAULT_DURATION_HOURS)
  );

  if (!endTime || Number.isNaN(endTime.getTime()) || endTime <= safeStartTime) {
    endTime = new Date(safeStartTime.getTime() + duration * 60 * 60 * 1000);
  }

  return {
    startTime: safeStartTime,
    endTime,
    duration,
  };
}

function getHourlyRate(parking) {
  return Number(parking?.pricePerHour || parking?.fare || parking?.dynamicPrice || 0);
}

function calculateBookingAmount(parking, windowDetails) {
  return Math.max(0, Math.round(getHourlyRate(parking) * Number(windowDetails?.duration || DEFAULT_DURATION_HOURS)));
}

function isActiveWindow(windowDetails, currentDate = new Date()) {
  if (!windowDetails?.startTime || !windowDetails?.endTime) {
    return true;
  }

  return windowDetails.startTime <= currentDate && windowDetails.endTime > currentDate;
}

function isTimeWithinAvailability(windowDetails, parking) {
  const openTime = parking?.availabilityHours?.openTime;
  const closeTime = parking?.availabilityHours?.closeTime;

  if (!openTime || !closeTime) {
    return true;
  }

  const startMinutes = windowDetails.startTime.getHours() * 60 + windowDetails.startTime.getMinutes();
  const endMinutes = windowDetails.endTime.getHours() * 60 + windowDetails.endTime.getMinutes();
  const [openHours, openMinutes] = String(openTime).split(":").map((value) => Number.parseInt(value, 10));
  const [closeHours, closeMinutes] = String(closeTime).split(":").map((value) => Number.parseInt(value, 10));
  const openTotal = (Number.isNaN(openHours) ? 0 : openHours) * 60 + (Number.isNaN(openMinutes) ? 0 : openMinutes);
  const closeTotal = (Number.isNaN(closeHours) ? 23 : closeHours) * 60 + (Number.isNaN(closeMinutes) ? 59 : closeMinutes);

  return startMinutes >= openTotal && endMinutes <= closeTotal;
}

function buildTimeOverlapQuery(parkingId, windowDetails, extraMatch = {}) {
  return {
    parkingId,
    status: { $in: ["pending", "confirmed"] },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    startTime: { $lt: windowDetails.endTime },
    endTime: { $gt: windowDetails.startTime },
    ...extraMatch,
  };
}

async function findAvailableSlotForWindow(parking, windowDetails) {
  const slotLayout = ensureSlotLayout(parking);
  const overlappingBookings = await Booking.find(
    buildTimeOverlapQuery(parking._id, windowDetails)
  ).select("assignedSlotCode");

  const occupiedCodes = new Set(
    overlappingBookings.map((booking) => booking.assignedSlotCode).filter(Boolean)
  );

  const candidates = slotLayout.slots
    .filter((slot) => !occupiedCodes.has(slot.code))
    .map((slot) => ({
      ...slot,
      rowLoad: overlappingBookings.filter((booking) => booking.assignedSlotCode?.startsWith(`S${String(slot.row).padStart(2, "0")}`)).length,
      laneBias: slot.row * 10 + slot.column,
    }))
    .sort((left, right) => left.rowLoad - right.rowLoad || left.laneBias - right.laneBias);

  return {
    overlappingBookings,
    availableCount: Math.max(0, slotLayout.slots.length - occupiedCodes.size),
    assignedSlot: candidates[0] || null,
  };
}

async function getAvailabilityPreview(parking, windowDetails) {
  if (!isTimeWithinAvailability(windowDetails, parking)) {
    return {
      availableSlots: 0,
      assignedSlotCode: "",
      hourlyRate: getHourlyRate(parking),
      totalPrice: calculateBookingAmount(parking, windowDetails),
      recommendedTime: `Available between ${parking?.availabilityHours?.openTime || "06:00"} and ${parking?.availabilityHours?.closeTime || "23:00"}.`,
    };
  }

  const slotSelection = await findAvailableSlotForWindow(parking, windowDetails);
  const hourlyRate = getHourlyRate(parking);
  return {
    availableSlots: slotSelection.availableCount,
    assignedSlotCode: slotSelection.assignedSlot?.code || "",
    hourlyRate,
    totalPrice: calculateBookingAmount(parking, windowDetails),
    recommendedTime:
      parking.peakHours?.length
        ? `Peak hours around ${parking.peakHours.map((hour) => `${hour}:00`).join(", ")}.`
        : "Current window is clear for booking.",
  };
}

module.exports = {
  DEFAULT_DURATION_HOURS,
  buildTimeOverlapQuery,
  calculateBookingAmount,
  findAvailableSlotForWindow,
  getAvailabilityPreview,
  getHourlyRate,
  isActiveWindow,
  isTimeWithinAvailability,
  normalizeBookingWindow,
};
