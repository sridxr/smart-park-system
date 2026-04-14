const mongoose = require("mongoose");

const FraudLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["rapid-bookings", "repeated-cancellations"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["medium", "high", "critical"],
      default: "medium",
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["open", "reviewed", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.FraudLog || mongoose.model("FraudLog", FraudLogSchema);
