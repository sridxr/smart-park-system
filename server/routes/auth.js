const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { requireAuth } = require("../middleware/auth");
const { emitRealtimeEvent } = require("../realtime/socketServer");
const { createNotification } = require("../services/notificationService");
const { createSystemLog } = require("../services/systemLogService");

const router = express.Router();

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    avatar: user.avatar || "",
    emailVerified: user.emailVerified,
    favoriteParkings: user.favoriteParkings || [],
    status: user.status,
    onboardingCompleted: Boolean(user.onboardingCompleted),
  };
}

function buildAuthResponse(user) {
  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: sanitizeUser(user),
  };
}

function getDashboardUrl(role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "lender") return "/lender/dashboard";
  return "/user/dashboard";
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res
        .status(400)
        .json({ msg: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: role === "lender" ? "lender" : "user",
      // New manual signups are immediately usable without any email verification step.
      emailVerified: true,
      verificationToken: null,
      verificationExpiresAt: null,
    });

    emitRealtimeEvent({
      event: "user:changed",
      payload: {
        action: "created",
        userId: user._id.toString(),
        role: user.role,
      },
      rooms: ["role:admin"],
    });

    await Promise.all([
      createNotification({
        userId: user._id,
        title: "Welcome to SmartPark AI",
        message: "Your account is active and ready for live parking recommendations.",
        type: "system",
        actionUrl: getDashboardUrl(user.role),
      }),
      createSystemLog({
        actor: user,
        action: "auth.signup",
        targetType: "user",
        targetId: user._id.toString(),
        description: "User created an account with email/password signup.",
      }),
    ]);

    return res.status(201).json({
      msg: "Account created successfully. You can sign in immediately.",
      user: sanitizeUser(user),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    // Backward compatibility for older accounts or stale verification links.
    if (!token) {
      return res.json({
        msg: "Email verification is no longer required. You can sign in directly.",
      });
    }

    const user = await User.findOne({ verificationToken: token });
    if (user) {
      user.emailVerified = true;
      user.verificationToken = null;
      user.verificationExpiresAt = null;
      user.lastLoginAt = new Date();
      await user.save();

      return res.json({
        msg: "Email verification is no longer required. Your account is ready.",
        ...buildAuthResponse(user),
      });
    }

    return res.json({
      msg: "Email verification is no longer required. You can sign in directly.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Preserve the route without SMTP by marking older accounts verified locally.
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationExpiresAt = null;
    await user.save();

    return res.json({
      msg: "Email verification is no longer required. This account can sign in directly.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ msg: "User not found" });
    if (!user.password) {
      return res
        .status(400)
        .json({ msg: "Password login is not available for this account." });
    }
    if (user.status === "blocked") {
      return res.status(403).json({ msg: "Your account is blocked" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    user.lastLoginAt = new Date();
    await user.save();

    await createSystemLog({
      actor: user,
      action: "auth.login",
      targetType: "session",
      targetId: user._id.toString(),
      description: "User signed in with email/password.",
    });

    return res.json(buildAuthResponse(user));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const updates = {
      name: req.body.name?.trim() || req.user.name,
      phone: req.body.phone?.trim?.() ?? req.user.phone,
      avatar: req.body.avatar?.trim?.() ?? req.user.avatar,
    };

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password -verificationToken");

    await createSystemLog({
      actor: user,
      action: "profile.updated",
      targetType: "user",
      targetId: user._id.toString(),
      description: "User updated profile settings.",
    });

    emitRealtimeEvent({
      event: "user:changed",
      payload: {
        action: "profile-updated",
        userId: user._id.toString(),
      },
      rooms: [`user:${user._id.toString()}`],
    });

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/favorites/:parkingId", requireAuth, async (req, res) => {
  const { parkingId } = req.params;
  const exists = req.user.favoriteParkings.some(
    (favorite) => favorite.toString() === parkingId
  );

  const update = exists
    ? { $pull: { favoriteParkings: parkingId } }
    : { $addToSet: { favoriteParkings: parkingId } };

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
  }).select("-password -verificationToken");

  await createSystemLog({
    actor: req.user,
    action: exists ? "favorites.removed" : "favorites.added",
    targetType: "parking",
    targetId: parkingId,
    description: exists
      ? "User removed a parking from favorites."
      : "User added a parking to favorites.",
  });

  emitRealtimeEvent({
    event: "user:changed",
    payload: {
      action: "favorites",
      userId: req.user._id.toString(),
    },
    rooms: [`user:${req.user._id.toString()}`],
  });

  return res.json({ favorites: user.favoriteParkings });
});

module.exports = router;
