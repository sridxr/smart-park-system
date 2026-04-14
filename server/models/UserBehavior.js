const mongoose = require("mongoose");

const SearchEntrySchema = new mongoose.Schema(
  {
    query: { type: String, default: "" },
    fullText: { type: String, default: "" },
    area: { type: String, default: "" },
    district: { type: String, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    carType: { type: String, default: "sedan" },
    maxPrice: { type: Number, default: 0 },
    maxDistance: { type: Number, default: 0 },
    searchedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BookingEntrySchema = new mongoose.Schema(
  {
    parkingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parking",
      default: null,
    },
    title: { type: String, default: "" },
    area: { type: String, default: "" },
    district: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    bookedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserBehaviorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    searchedLocations: {
      type: [SearchEntrySchema],
      default: [],
    },
    bookedLocations: {
      type: [BookingEntrySchema],
      default: [],
    },
    bookingHourHistogram: {
      type: [Number],
      default: () => Array.from({ length: 24 }, () => 0),
    },
    preferredPriceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    preferredLocations: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.UserBehavior || mongoose.model("UserBehavior", UserBehaviorSchema);
