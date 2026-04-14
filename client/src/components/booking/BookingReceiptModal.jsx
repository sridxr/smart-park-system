import { AnimatePresence, motion as Motion } from "framer-motion";
import { CheckCircle2, Receipt, X } from "lucide-react";

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function BookingReceiptModal({ booking, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && booking ? (
        <>
          <Motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-slate-950/75 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <Motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[560px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(18,24,38,0.98),rgba(11,15,25,0.98))] shadow-[0_30px_120px_rgba(2,8,23,0.58)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500" />

              <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-blue-100">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-blue-300/70">Booking receipt</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{booking.parkingTitle}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/70"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 pb-6">
                <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-white/40">Booking ID</p>
                      <p className="mt-2 break-all text-sm text-white">{booking._id}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-white/40">Status</p>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-100">
                        <CheckCircle2 size={14} />
                        {booking.status}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-white/40">Schedule</p>
                      <p className="mt-2 text-sm text-white">
                        {booking.startTime
                          ? `${formatDateTime(booking.startTime)} to ${new Date(booking.endTime).toLocaleTimeString("en-IN", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}`
                          : formatDateTime(booking.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-white/40">Amount</p>
                      <p className="mt-2 text-sm text-white">Rs. {booking.amount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-white/40">Assigned slot</p>
                      <p className="mt-2 text-sm text-white">{booking.assignedSlotCode || "Auto assigned at arrival"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-white/40">Duration</p>
                      <p className="mt-2 text-sm text-white">{booking.duration ? `${booking.duration} hour(s)` : "Flexible"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-4 text-sm text-white/60">
                  This receipt reflects the booking state currently stored in SmartPark AI and stays available from your bookings workspace.
                </div>
              </div>
            </Motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default BookingReceiptModal;
