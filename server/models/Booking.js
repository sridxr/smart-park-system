const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    lender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    parkingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parking",
      required: true,
    },
    parkingTitle: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["created", "success", "paid", "failed"],
      default: "created",
    },
    paymentId: {
      type: String,
      default: "",
    },
    orderId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "pending", "completed"],
      default: "pending",
    },
    assignedSlotCode: {
      type: String,
      default: "",
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 1,
    },
    vehicleSnapshot: {
      vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        default: null,
      },
      label: {
        type: String,
        default: "",
      },
      type: {
        type: String,
        default: "",
      },
      vehicleType: {
        type: String,
        default: "",
      },
      brand: {
        type: String,
        default: "",
      },
      model: {
        type: String,
        default: "",
      },
      vehicleSize: {
        type: String,
        default: "",
      },
      number: {
        type: String,
        default: "",
      },
    },
    slotActivated: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    demandAtBooking: {
      type: String,
      default: "Low",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
