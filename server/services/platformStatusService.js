const Notification = require("../models/Notification");
const Booking = require("../models/Booking");
const SystemLog = require("../models/SystemLog");
const { getDecisionStatus } = require("./decisionStatusService");

async function getPlatformStatus({ user }) {
  const [unreadCount, latestBooking, latestLog, decisionStatus] = await Promise.all([
    Notification.countDocuments({
      user: user._id,
      $or: [{ readAt: null }, { read: false }],
    }),
    Booking.findOne(
      user.role === "admin"
        ? {}
        : user.role === "lender"
          ? { lender: user._id }
          : { user: user._id }
    )
      .sort({ updatedAt: -1 })
      .select("updatedAt"),
    SystemLog.findOne(
      user.role === "admin"
        ? {}
        : {
            $or: [{ actor: user._id }, { targetId: user._id.toString() }],
          }
    )
      .sort({ createdAt: -1 })
      .select("createdAt"),
    getDecisionStatus({ userId: user._id, role: user.role }),
  ]);

  const lastUpdatedAt = latestBooking?.updatedAt || latestLog?.createdAt || new Date();

  return {
    systemOnline: true,
    lastUpdatedAt,
    unreadCount,
    ...decisionStatus,
  };
}

module.exports = {
  getPlatformStatus,
};
