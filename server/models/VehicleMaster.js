const mongoose = require("mongoose");

const VehicleMasterSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["car", "bike", "suv", "ev"],
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
  },
  { timestamps: true }
);

VehicleMasterSchema.index({ type: 1, brand: 1, model: 1 }, { unique: true });

module.exports = mongoose.models.VehicleMaster || mongoose.model("VehicleMaster", VehicleMasterSchema);
