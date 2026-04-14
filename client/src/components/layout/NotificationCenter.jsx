import { AnimatePresence, motion as Motion } from "framer-motion";
import { Bell, CheckCheck, Dot } from "lucide-react";

function getNotificationTone(notification) {
  const type = String(notification?.type || "").toLowerCase();

  if (type === "alert" || type === "critical") {
    return {
      label: "Critical",
      chip: "border-rose-400/25 bg-rose-500/10 text-rose-100",
    };
  }

  if (type === "suggestion" || type === "insight") {
    return {
      label: "Suggestion",
      chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
    };
  }

  return {
    label: "Info",
    chip: "border-sky-400/25 bg-sky-500/10 text-sky-100",
  };
}

function NotificationCenter({
  isOpen,
  notifications = [],
  unreadCount = 0,
  onToggle,
  onMarkRead,
  onNavigate,
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-white/70 transition hover:border-white/20 hover:bg-white/[0.06]"
      >
        <Bell size={16} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-[0_0_0_3px_rgba(11,15,25,0.9)]">
            {unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 top-14 z-[60] w-96 rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,8,23,0.98))] p-4 shadow-[0_24px_100px_rgba(2,8,23,0.58)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/35">Notifications</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Smart alerts</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                {unreadCount} unread
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`rounded-2xl border p-4 transition hover:border-white/15 hover:bg-white/[0.06] ${
                    !notification.readAt && !notification.read
                      ? "border-blue-400/20 bg-blue-500/[0.06]"
                      : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getNotificationTone(notification).chip}`}
                    >
                      {getNotificationTone(notification).label}
                    </span>
                    {!notification.readAt && !notification.read ? (
                      <button
                        type="button"
                        onClick={() => onMarkRead(notification._id)}
                        className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition hover:bg-white/10"
                      >
                        <CheckCheck size={14} />
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate?.(notification)}
                      className="min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        {!notification.readAt && !notification.read ? (
                          <Dot size={18} className="text-blue-300" />
                        ) : null}
                        <p className="font-medium text-white">{notification.title || "Platform notification"}</p>
                      </div>
                      <p className="mt-2 text-sm text-white/60">{notification.message || "A new update is available."}</p>
                    </button>
                  </div>
                </div>
              ))}
              {!notifications.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">
                  No notifications yet. Booking, AI, and platform alerts will appear here.
                </div>
              ) : null}
            </div>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default NotificationCenter;
