import { Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import BookingReceiptModal from "../../components/booking/BookingReceiptModal";
import BillingPanel from "../../components/mobility/BillingPanel";
import TripStatus from "../../components/mobility/TripStatus";

function UserBookingsPage() {
  const workspace = useOutletContext();
  const [tab, setTab] = useState("active");
  const [selectedReceiptId, setSelectedReceiptId] = useState("");
  const [reviewDrafts, setReviewDrafts] = useState({});

  const rows = useMemo(() => {
    if (tab === "active") {
      return workspace.bookings.filter((booking) => booking.status !== "cancelled").slice(0, 12);
    }
    return workspace.bookings.slice(0, 20);
  }, [tab, workspace.bookings]);
  const selectedReceipt = useMemo(
    () => workspace.bookings.find((booking) => booking._id === selectedReceiptId) || null,
    [selectedReceiptId, workspace.bookings]
  );

  return (
    <>
      <div className="space-y-6">
        <TripStatus
          trip={workspace.activeTrip}
          onAdvance={workspace.updateTripStage}
          onExtend={workspace.extendActiveTrip}
          onComplete={workspace.completeActiveTrip}
        />
        <BillingPanel billing={workspace.currentBilling} />
      </div>

      <div className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Bookings</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Track active and historical reservations</h3>
          </div>
          <div className="flex gap-2">
            {["active", "history"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`rounded-full px-4 py-2 text-sm ${
                  tab === value ? "bg-emerald-300 text-slate-950" : "border border-white/10 bg-white/5 text-white/70"
                }`}
              >
                {value === "active" ? "Active" : "History"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {rows.map((booking) => (
            <div key={booking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              {(() => {
                const relatedTrip =
                  workspace.tripHistory.find((trip) => trip.booking?._id === booking._id) ||
                  workspace.tripHistory.find((trip) => trip.booking === booking._id);

                return (
                  <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{booking.parkingTitle}</p>
                  <p className="mt-2 text-sm text-white/55">
                    {booking.parkingId?.address?.area || "City parking"} | {booking.startTime
                      ? `${new Date(booking.startTime).toLocaleDateString("en-IN")} ${new Date(booking.startTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} - ${new Date(booking.endTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`
                      : new Date(booking.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right text-sm text-white/70">
                  <p>Rs. {booking.amount}</p>
                  <p className="mt-1">{booking.status}{booking.assignedSlotCode ? ` | Slot ${booking.assignedSlotCode}` : ""}{booking.duration ? ` | ${booking.duration}h` : ""}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <div className="flex flex-wrap justify-end gap-2">
                  {!workspace.activeTrip && booking.status === "confirmed" ? (
                    <button
                      type="button"
                      onClick={() => workspace.startTripForBooking(booking._id)}
                      className="app-button-primary rounded-2xl px-4 py-2 text-sm font-semibold"
                    >
                      Start trip
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptId(booking._id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
                  >
                    <Receipt size={16} />
                    View receipt
                  </button>
                </div>
              </div>
              {booking.status === "completed" ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Rate this parking</p>
                  <div className="mt-3 flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setReviewDrafts((current) => ({
                            ...current,
                            [booking._id]: {
                              ...current[booking._id],
                              rating: value,
                            },
                          }))
                        }
                        className={`rounded-full px-3 py-2 text-xs ${
                          (reviewDrafts[booking._id]?.rating || 0) >= value
                            ? "bg-amber-300 text-slate-950"
                            : "border border-white/10 bg-white/5 text-white/70"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewDrafts[booking._id]?.review || ""}
                    onChange={(event) =>
                      setReviewDrafts((current) => ({
                        ...current,
                        [booking._id]: {
                          ...current[booking._id],
                          review: event.target.value,
                        },
                      }))
                    }
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                    rows={3}
                    placeholder="Share your parking experience"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      workspace.submitTripReview({
                        tripId: relatedTrip?._id,
                        rating: reviewDrafts[booking._id]?.rating || 5,
                        review: reviewDrafts[booking._id]?.review || "",
                      })
                    }
                    disabled={!relatedTrip}
                    className="app-button-secondary mt-3 rounded-2xl px-4 py-2 text-sm font-semibold"
                  >
                    Save review
                  </button>
                  {!relatedTrip ? (
                    <p className="mt-2 text-xs text-white/45">Complete a tracked trip session to submit a review.</p>
                  ) : null}
                </div>
              ) : null}
                  </>
                );
              })()}
            </div>
          ))}
          {!rows.length ? (
            <div className="app-empty-state rounded-2xl p-5 text-sm">
              No bookings yet. Start your first booking and your live receipts will appear here.
            </div>
          ) : null}
        </div>
      </div>
      <BookingReceiptModal
        booking={selectedReceipt}
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceiptId("")}
      />
    </>
  );
}

export default UserBookingsPage;
