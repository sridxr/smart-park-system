const mongoose = require("mongoose");

const TripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    parking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parking",
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    status: {
      type: String,
      enum: ["navigating", "arrived", "parked", "completed"],
      default: "navigating",
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    arrivalTime: {
      type: Date,
      default: null,
    },
    parkedAt: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    plannedEndTime: {
      type: Date,
      default: null,
    },
    extraDurationMinutes: {
      type: Number,
      default: 0,
    },
    lastKnownLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      fullText: { type: String, default: "" },
    },
    latestEtaMinutes: {
      type: Number,
      default: null,
    },
    latestTrafficDelayMinutes: {
      type: Number,
      default: 0,
    },
    routeQuality: {
      type: String,
      default: "Unknown",
    },
    rerouteSuggestion: {
      message: { type: String, default: "" },
      savedMinutes: { type: Number, default: 0 },
      updatedAt: { type: Date, default: null },
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Trip || mongoose.model("Trip", TripSchema);
