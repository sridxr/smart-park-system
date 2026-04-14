const mongoose = require("mongoose");

const DecisionProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    prefersCheap: {
      type: Boolean,
      default: false,
    },
    prefersFast: {
      type: Boolean,
      default: false,
    },
    preferredAreas: {
      type: [String],
      default: [],
    },
    avgBookingTime: {
      type: Number,
      default: 0,
    },
    walkingTolerance: {
      type: String,
      enum: ["short", "balanced", "long"],
      default: "balanced",
    },
    avoidsTraffic: {
      type: Boolean,
      default: false,
    },
    confidence: {
      type: Number,
      default: 0,
    },
    lastComputedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DecisionProfile || mongoose.model("DecisionProfile", DecisionProfileSchema);
