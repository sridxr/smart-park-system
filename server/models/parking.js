const mongoose = require("mongoose");

const ParkingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    address: {
      fullText: {
        type: String,
        default: "",
      },
      doorNo: String,
      apartment: String,
      area: String,
      landmark: String,
      district: String,
      state: String,
      city: String,
      country: {
        type: String,
        default: "India",
      },
      postalCode: String,
    },
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    timeSlot: {
      start: Date,
      end: Date,
    },
    availabilityHours: {
      openTime: {
        type: String,
        default: "06:00",
      },
      closeTime: {
        type: String,
        default: "23:00",
      },
    },
    fare: {
      type: Number,
      default: 0,
    },
    pricePerHour: {
      type: Number,
      default: 0,
    },
    dynamicPrice: {
      type: Number,
      default: 0,
    },
    parkingSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "small",
    },
    totalSlots: {
      type: Number,
      default: 10,
    },
    availableSlots: {
      type: Number,
      default: 10,
    },
    exitProfile: {
      easeScore: {
        type: Number,
        default: 70,
      },
      laneLabel: {
        type: String,
        default: "Main exit",
      },
    },
    slotLayout: {
      rows: {
        type: Number,
        default: 0,
      },
      columns: {
        type: Number,
        default: 0,
      },
      slots: [
        {
          code: {
            type: String,
            default: "",
          },
          status: {
            type: String,
            enum: ["available", "occupied"],
            default: "available",
          },
          occupied: {
            type: Boolean,
            default: false,
          },
          sensorStatus: {
            type: String,
            enum: ["online", "syncing", "offline"],
            default: "online",
          },
          sensorUpdatedAt: {
            type: Date,
            default: Date.now,
          },
          row: {
            type: Number,
            default: 1,
          },
          column: {
            type: Number,
            default: 1,
          },
        },
      ],
    },
    allowedCars: {
      type: [String],
      default: [],
    },
    supportedVehicleTypes: {
      type: [String],
      default: [],
    },
    supportedBrands: {
      type: [String],
      default: [],
    },
    supportedModels: {
      type: [String],
      default: [],
    },
    supportedVehicleSizes: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    demandLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    peakHours: {
      type: [Number],
      default: [],
    },
    liveMetrics: {
      recentBookings: {
        type: Number,
        default: 0,
      },
      occupancyRate: {
        type: Number,
        default: 0,
      },
      demandScore: {
        type: Number,
        default: 0,
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Parking || mongoose.model("Parking", ParkingSchema);
