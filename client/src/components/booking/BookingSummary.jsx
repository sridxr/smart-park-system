function BookingSummary({
  bookingWindow,
  totalPrice = 0,
  hourlyRate = 0,
  availableSlots = null,
  assignedSlotCode = "",
  recommendedTime = "",
  selectedVehicle = null,
  compatibilityLabel = "",
}) {
  const summaryDate = bookingWindow?.startTime
    ? new Date(bookingWindow.startTime).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "-";
  const summaryStart = bookingWindow?.startTime
    ? new Date(bookingWindow.startTime).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "-";
  const summaryEnd = bookingWindow?.endTime
    ? new Date(bookingWindow.endTime).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "-";

  return (
    <div className="app-card rounded-[28px] p-5">
      <p className="text-xs uppercase tracking-[0.35em] text-white/40">Booking Summary</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-white/40">Date</p>
          <p className="mt-2 text-white">{summaryDate}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-white/40">Time</p>
          <p className="mt-2 text-white">{summaryStart} - {summaryEnd}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-white/40">Duration</p>
          <p className="mt-2 text-white">{bookingWindow?.duration || 1} hour(s)</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-white/40">Rate</p>
          <p className="mt-2 text-white">Rs. {hourlyRate}/hour</p>
        </div>
      </div>
      {selectedVehicle ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-100">Vehicle</p>
          <p className="mt-2 text-white">
            {[selectedVehicle.brand, selectedVehicle.model].filter(Boolean).join(" ") || selectedVehicle.label}
          </p>
          {compatibilityLabel ? (
            <p className="mt-2 text-sm text-white/70">{compatibilityLabel}</p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
        <p className="text-sm text-blue-100">Total</p>
        <p className="mt-2 text-2xl font-semibold text-white">Rs. {totalPrice}</p>
        {availableSlots !== null ? (
          <p className="mt-2 text-sm text-white/70">
            {availableSlots} slot(s) available{assignedSlotCode ? ` | Suggested ${assignedSlotCode}` : ""}
          </p>
        ) : null}
        {recommendedTime ? (
          <p className="mt-2 text-sm text-white/65">{recommendedTime}</p>
        ) : null}
      </div>
    </div>
  );
}

export default BookingSummary;
