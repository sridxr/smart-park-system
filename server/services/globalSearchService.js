const Booking = require("../models/Booking");
const FraudLog = require("../models/FraudLog");
const Notification = require("../models/Notification");
const Parking = require("../models/parking");
const SystemLog = require("../models/SystemLog");
const User = require("../models/user");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRegex(query) {
  return new RegExp(escapeRegExp(query.trim()), "i");
}

function buildHighlightRanges(text = "", query = "") {
  if (!text || !query) {
    return [];
  }

  const start = text.toLowerCase().indexOf(query.toLowerCase());
  if (start === -1) {
    return [];
  }

  return [{ start, end: start + query.length }];
}

function buildResult({ id, label, helper, to, type, query }) {
  return {
    id,
    label,
    helper,
    to,
    type,
    highlightRanges: {
      label: buildHighlightRanges(label, query),
      helper: buildHighlightRanges(helper, query),
    },
  };
}

async function searchForUser({ user, query, limit = 8 }) {
  const regex = buildRegex(query);
  const [parkings, bookings, notifications] = await Promise.all([
    Parking.find({
      isActive: true,
      $or: [
        { title: regex },
        { "address.fullText": regex },
        { "address.area": regex },
        { "address.district": regex },
      ],
    })
      .limit(4)
      .select("title address dynamicPrice fare"),
    Booking.find({
      user: user._id,
      $or: [{ parkingTitle: regex }, { status: regex }, { assignedSlotCode: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("parkingTitle status assignedSlotCode"),
    Notification.find({
      user: user._id,
      $or: [{ title: regex }, { message: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title message actionUrl"),
  ]);

  return [
    ...parkings.map((parking) =>
      buildResult({
        id: `parking_${parking._id}`,
        label: parking.title,
        helper: `${parking.address?.area || "Parking"} · Rs. ${parking.dynamicPrice || parking.fare || 0}`,
        to: "/user/explore",
        type: "parking",
        query,
      })
    ),
    ...bookings.map((booking) =>
      buildResult({
        id: `booking_${booking._id}`,
        label: booking.parkingTitle,
        helper: `${booking.status}${booking.assignedSlotCode ? ` · Slot ${booking.assignedSlotCode}` : ""}`,
        to: "/user/bookings",
        type: "booking",
        query,
      })
    ),
    ...notifications.map((notification) =>
      buildResult({
        id: `notification_${notification._id}`,
        label: notification.title,
        helper: notification.message,
        to: notification.actionUrl || "/user/dashboard",
        type: "notification",
        query,
      })
    ),
  ].slice(0, limit);
}

async function searchForLender({ user, query, limit = 8 }) {
  const regex = buildRegex(query);
  const [listings, bookings, notifications] = await Promise.all([
    Parking.find({
      owner: user._id,
      $or: [
        { title: regex },
        { "address.fullText": regex },
        { "address.area": regex },
      ],
    })
      .limit(4)
      .select("title address availableSlots totalSlots"),
    Booking.find({
      lender: user._id,
      $or: [{ parkingTitle: regex }, { status: regex }, { userEmail: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("parkingTitle status userEmail"),
    Notification.find({
      user: user._id,
      $or: [{ title: regex }, { message: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title message actionUrl"),
  ]);

  return [
    ...listings.map((listing) =>
      buildResult({
        id: `listing_${listing._id}`,
        label: listing.title,
        helper: `${listing.address?.area || "Listing"} · ${listing.availableSlots}/${listing.totalSlots} slots`,
        to: "/lender/parkings",
        type: "listing",
        query,
      })
    ),
    ...bookings.map((booking) =>
      buildResult({
        id: `lender_booking_${booking._id}`,
        label: booking.parkingTitle,
        helper: `${booking.status} · ${booking.userEmail}`,
        to: "/lender/bookings",
        type: "booking",
        query,
      })
    ),
    ...notifications.map((notification) =>
      buildResult({
        id: `notification_${notification._id}`,
        label: notification.title,
        helper: notification.message,
        to: notification.actionUrl || "/lender/dashboard",
        type: "notification",
        query,
      })
    ),
  ].slice(0, limit);
}

async function searchForAdmin({ query, limit = 10 }) {
  const regex = buildRegex(query);
  const [users, parkings, fraudLogs, systemLogs] = await Promise.all([
    User.find({
      $or: [{ name: regex }, { email: regex }, { role: regex }, { status: regex }],
    })
      .limit(4)
      .select("name email role status"),
    Parking.find({
      $or: [
        { title: regex },
        { "address.fullText": regex },
        { "address.area": regex },
        { demandLevel: regex },
      ],
    })
      .limit(3)
      .select("title address demandLevel"),
    FraudLog.find({
      $or: [{ email: regex }, { type: regex }, { message: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("user", "name email"),
    SystemLog.find({
      $or: [{ description: regex }, { action: regex }, { actorEmail: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("description action actorEmail"),
  ]);

  return [
    ...users.map((entry) =>
      buildResult({
        id: `user_${entry._id}`,
        label: entry.name || entry.email,
        helper: `${entry.role} · ${entry.status} · ${entry.email}`,
        to: "/admin/users",
        type: "user",
        query,
      })
    ),
    ...parkings.map((parking) =>
      buildResult({
        id: `parking_${parking._id}`,
        label: parking.title,
        helper: `${parking.address?.area || "Parking"} · ${parking.demandLevel || "Low"} demand`,
        to: "/admin/parkings",
        type: "parking",
        query,
      })
    ),
    ...fraudLogs.map((log) =>
      buildResult({
        id: `fraud_${log._id}`,
        label: log.user?.name || log.email,
        helper: log.message,
        to: "/admin/alerts",
        type: "fraud",
        query,
      })
    ),
    ...systemLogs.map((log) =>
      buildResult({
        id: `log_${log._id}`,
        label: log.description || log.action,
        helper: `${log.action}${log.actorEmail ? ` · ${log.actorEmail}` : ""}`,
        to: "/admin/alerts",
        type: "system-log",
        query,
      })
    ),
  ].slice(0, limit);
}

async function searchPlatform({ user, query, limit = 8 }) {
  const trimmedQuery = String(query || "").trim();
  if (!trimmedQuery) {
    return [];
  }

  if (user.role === "admin") {
    return searchForAdmin({ query: trimmedQuery, limit });
  }

  if (user.role === "lender") {
    return searchForLender({ user, query: trimmedQuery, limit });
  }

  return searchForUser({ user, query: trimmedQuery, limit });
}

module.exports = {
  searchPlatform,
};
