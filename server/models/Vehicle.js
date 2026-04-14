const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["car", "bike", "suv", "ev"],
      default: "car",
    },
    vehicleType: {
      type: String,
      enum: ["hatchback", "sedan", "suv", "bike", "car", "ev"],
      default: "car",
    },
    brand: {
      type: String,
      default: "",
      trim: true,
    },
    model: {
      type: String,
      default: "",
      trim: true,
    },
    vehicleSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    number: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Vehicle || mongoose.model("Vehicle", VehicleSchema);
