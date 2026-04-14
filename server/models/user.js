const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "lender", "admin"],
      default: "user",
    },
    emailVerified: {
      type: Boolean,
      // Manual email/password accounts no longer require email verification.
      default: true,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationExpiresAt: {
      type: Date,
      default: null,
    },
    favoriteParkings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parking",
      },
    ],
    revenue: {
      type: Number,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "blocked", "pending"],
      default: "active",
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
