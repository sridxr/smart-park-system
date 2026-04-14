import { useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { CheckCircle2, CreditCard, LoaderCircle, ShieldCheck, TimerReset } from "lucide-react";

import LiveClock from "./LiveClock";
import BookingSummary from "./booking/BookingSummary";
import DatePicker from "./booking/DatePicker";
import TimePicker from "./booking/TimePicker";
import VehicleSelector from "./mobility/VehicleSelector";
import SuccessBurst from "./ui/SuccessBurst";

function PaymentModal({
  isOpen,
  parking,
  userEmail,
  status = "idle",
  error = "",
  bookingWindow,
  availabilityPreview,
  reservationExpiresAt,
  checkoutSummary,
  vehicles = [],
  selectedVehicleId = "",
  selectedVehicle = null,
  onVehicleChange,
  onBookingWindowChange,
  onClose,
  onConfirm,
}) {
  const [tick, setTick] = useState(() => Date.now());
  const isProcessing = status === "processing";
  const isSuccess = status === "success";
  const isReserved = status === "reserved";
  const amount = Number(checkoutSummary?.totalPrice || parking?.dynamicPrice || parking?.fare || 0);
  const expiresAtMs = reservationExpiresAt ? new Date(reservationExpiresAt).getTime() : 0;
  const remainingMs = Math.max(0, expiresAtMs - tick);
  const remainingMinutes = String(Math.floor(remainingMs / 60000)).padStart(2, "0");
  const remainingSeconds = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0");
  const todayMin = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!isReserved) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReserved]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/80 px-4 py-6 backdrop-blur-md sm:items-center sm:py-8"
        >
          <Motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative my-auto w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(18,24,38,0.96),rgba(11,15,25,0.96))] shadow-[0_30px_120px_rgba(2,8,23,0.7)]"
          >
            {isSuccess ? <SuccessBurst /> : null}

            <div className="border-b border-white/10 bg-white/[0.04] px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-200">
                    {isSuccess ? <CheckCircle2 size={22} /> : <CreditCard size={22} />}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">
                      Simulated Checkout
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold text-white">
                      {isSuccess ? "Payment Successful" : "Complete Your Booking"}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="app-button-secondary rounded-full px-3 py-1 text-sm text-white/65 disabled:opacity-40"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto px-6 py-6">
              <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-5">
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm text-white/55">Parking</p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {parking?.title || "Selected parking"}
                        </p>
                        <p className="mt-2 text-sm text-white/55">
                          {parking?.address?.area || "Nearby"}{" "}
                          {parking?.address?.district ? `| ${parking.address.district}` : ""}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-left sm:min-w-[160px] sm:text-right">
                        <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/80">Amount</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-50">Rs. {amount}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-white/40">User</p>
                        <p className="mt-2 break-all text-sm text-white/80">
                          {userEmail || "Authenticated user"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Gateway</p>
                        <p className="mt-2 text-sm text-white/80">SmartPark Checkout Simulation</p>
                      </div>
                    </div>
                  </div>

                  {!isSuccess ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <DatePicker
                        min={todayMin}
                        value={bookingWindow?.date || todayMin}
                        onChange={(value) => onBookingWindowChange({ date: value })}
                      />
                      <TimePicker
                        value={bookingWindow?.startTimeValue || "09:00"}
                        onChange={(value) => onBookingWindowChange({ startTimeValue: value })}
                      />
                      <label className="md:col-span-2 block rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <span className="text-xs uppercase tracking-[0.25em] text-white/40">Duration</span>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          step="0.5"
                          value={bookingWindow?.duration || 1}
                          onChange={(event) =>
                            onBookingWindowChange({ duration: Number(event.target.value) })
                          }
                          className="mt-3 w-full"
                        />
                        <p className="mt-2 text-sm text-white/70">
                          {bookingWindow?.duration || 1} hour(s)
                        </p>
                      </label>
                      <div className="md:col-span-2">
                        <VehicleSelector
                          vehicles={vehicles}
                          selectedVehicleId={selectedVehicleId}
                          onChange={onVehicleChange}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-5">
                  {!isSuccess ? (
                    <BookingSummary
                      bookingWindow={bookingWindow}
                      totalPrice={checkoutSummary?.totalPrice || 0}
                      hourlyRate={checkoutSummary?.hourlyRate || 0}
                      availableSlots={availabilityPreview?.availableSlots ?? null}
                      assignedSlotCode={availabilityPreview?.assignedSlotCode || ""}
                      recommendedTime={availabilityPreview?.recommendedTime || ""}
                      selectedVehicle={selectedVehicle}
                      compatibilityLabel={parking?.ai?.vehicleCompatibility?.label || ""}
                    />
                  ) : null}

                  <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
                    {isSuccess ? (
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                          <CheckCircle2 size={14} />
                          Booking Confirmed
                        </div>
                        <p className="text-2xl font-semibold text-white">Payment Successful</p>
                        <p className="text-sm text-white/75">
                          Your parking slot is locked in. SmartPark AI has updated availability and synced your dashboard.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs text-sky-100">
                          {isProcessing ? (
                            <LoaderCircle className="animate-spin" size={14} />
                          ) : (
                            <ShieldCheck size={14} />
                          )}
                          {isProcessing
                            ? "Processing Payment..."
                            : isReserved
                              ? "Reservation active"
                              : "Secure simulation ready"}
                        </div>
                        <p className="text-sm text-white/75">
                          This is a realistic payment simulation for the booking flow. No real transaction will be charged.
                        </p>
                        {isReserved ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                              <TimerReset size={14} />
                              Expires in {remainingMinutes}:{remainingSeconds}
                            </div>
                            <LiveClock className="min-w-[170px]" />
                          </div>
                        ) : null}
                      </div>
                    )}

                    {error ? (
                      <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                        {error}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                      {isSuccess ? "Realtime sync complete" : "Startup-grade checkout experience"}
                    </p>
                    <button
                      type="button"
                      onClick={isSuccess ? onClose : onConfirm}
                      disabled={
                        isProcessing ||
                        availabilityPreview?.availableSlots === 0 ||
                        (isReserved && remainingMs <= 0)
                      }
                      className="app-button-primary w-full rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isSuccess
                        ? "Done"
                        : isProcessing
                          ? "Processing..."
                          : isReserved
                            ? "Pay & Book"
                            : "Reserve Slot"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default PaymentModal;
