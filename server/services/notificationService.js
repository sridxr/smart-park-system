const Notification = require("../models/Notification");
const { emitRealtimeEvent } = require("../realtime/socketServer");

async function createNotification({
  userId,
  title,
  message,
  type = "system",
  actionUrl = "",
  metadata = {},
}) {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    actionUrl,
    metadata,
    read: false,
  });

  emitRealtimeEvent({
    event: "notification:changed",
    payload: {
      notificationId: notification._id.toString(),
      userId: userId.toString(),
      type,
    },
    rooms: [`user:${userId.toString()}`],
  });

  return notification;
}

async function notifyBookingConfirmed({ userId, lenderId, parkingTitle, amount }) {
  const tasks = [
    createNotification({
      userId,
      title: "Booking confirmed",
      message: `${parkingTitle} is confirmed for Rs. ${amount}.`,
      type: "booking",
      actionUrl: "/user/bookings",
    }),
  ];

  if (lenderId) {
    tasks.push(
      createNotification({
        userId: lenderId,
        title: "New booking received",
        message: `${parkingTitle} has a new confirmed booking worth Rs. ${amount}.`,
        type: "booking",
        actionUrl: "/lender/bookings",
      })
    );
  }

  return Promise.all(tasks);
}

async function notifyParkingPressure({ lenderId, adminIds = [], parkingTitle, availableSlots }) {
  const recipients = [lenderId, ...adminIds].filter(Boolean);
  return Promise.all(
    recipients.map((userId) =>
      createNotification({
        userId,
        title: "Parking almost full",
        message: `${parkingTitle} is down to ${availableSlots} slots.`,
        type: "alert",
        actionUrl: "/admin/alerts",
      })
    )
  );
}

async function listNotificationsForUser(userId) {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(12);
}

async function markNotificationRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { readAt: new Date(), read: true },
    { new: true }
  );
}

module.exports = {
  createNotification,
  listNotificationsForUser,
  markNotificationRead,
  notifyBookingConfirmed,
  notifyParkingPressure,
};
