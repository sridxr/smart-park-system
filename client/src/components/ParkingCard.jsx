import { motion as Motion } from "framer-motion";

function buildExplanationPoints(parking) {
  const points = [];

  if (parking.ai?.distanceKm !== null && parking.ai?.distanceKm !== undefined) {
    points.push(`${parking.ai.distanceKm} km away`);
  }

  if (parking.dynamicPrice || parking.fare) {
    points.push(`Rs. ${parking.dynamicPrice || parking.fare} live price`);
  }

  if (parking.ai?.demandLevel) {
    points.push(`${parking.ai.demandLevel} demand`);
  }

  if (parking.ai?.traffic?.eta) {
    points.push(`ETA ${parking.ai.traffic.eta}`);
  }

  if (parking.ai?.carFit) {
    points.push(`${parking.ai.carFit} fit for your car`);
  }

  if (parking.ai?.vehicleCompatibility?.label) {
    points.push(parking.ai.vehicleCompatibility.label);
  }

  return points.slice(0, 3);
}

function ParkingCard({
  parking,
  isFavorite,
  onFavorite,
  onBook,
  bookingId,
  accent = "emerald",
}) {
  const accentClasses = {
    emerald: "text-emerald-200 border-emerald-400/20 bg-emerald-400/10",
    blue: "text-sky-200 border-sky-400/20 bg-sky-400/10",
    violet: "text-violet-200 border-violet-400/20 bg-violet-400/10",
  };
  const availabilityState =
    parking.availableSlots <= 0
      ? { label: "Full", classes: "border-rose-400/20 bg-rose-400/10 text-rose-100" }
      : parking.totalSlots && parking.availableSlots / parking.totalSlots <= 0.3
        ? { label: "Limited", classes: "border-amber-400/20 bg-amber-400/10 text-amber-100" }
        : { label: "Available", classes: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" };
  const explanationPoints = buildExplanationPoints(parking);

  return (
    <Motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      className="app-card app-card-hover rounded-[30px] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{parking.title}</h3>
          <p className="mt-2 text-sm text-white/60">
            {parking.address?.area}, {parking.address?.district}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs ${availabilityState.classes}`}>
            {availabilityState.label}
          </span>
          <button
            type="button"
            onClick={onFavorite}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            {isFavorite ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(parking.ai?.recommendationTags || []).map((tag) => (
          <span
            key={tag}
            className={`rounded-full border px-3 py-1 text-xs transition hover:scale-[1.02] ${accentClasses[accent]}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-950/60 p-3 text-white/70">
          <p className="text-white/40">Price</p>
          <p className="mt-2 text-lg font-semibold text-white">
            Rs. {parking.dynamicPrice || parking.fare}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/60 p-3 text-white/70">
          <p className="text-white/40">Slots</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {parking.availableSlots}/{parking.totalSlots}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/60 p-3 text-white/70">
          <p className="text-white/40">Demand</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {parking.ai?.demandLevel || parking.demandLevel}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/60 p-3 text-white/70">
          <p className="text-white/40">Car Fit</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {parking.ai?.carFit || "Balanced"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/60 p-3 text-white/70">
          <p className="text-white/40">Distance</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {parking.ai?.distanceKm !== null && parking.ai?.distanceKm !== undefined
              ? `${parking.ai.distanceKm} km`
              : "Nearby"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/60 p-3 text-white/70">
          <p className="text-white/40">Smart Score</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {parking.ai?.recommendationScore || 0}/100
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/60 p-3 text-white/70">
          <p className="text-white/40">ETA</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {parking.ai?.traffic?.eta || "Live"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/60 p-3 text-white/70">
          <p className="text-white/40">Traffic</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {parking.ai?.traffic?.routeQuality || "Balanced"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-4 text-sm text-white/70">
        <p className="text-sm font-semibold text-white">Recommended Parking</p>
        <p className="mt-2 text-white/90">
          {parking.ai?.explanation || "Live recommendation available."}
        </p>
        {parking.ai?.vehicleCompatibility?.applies ? (
          <p className="mt-3 text-white/75">{parking.ai.vehicleCompatibility.summary}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {explanationPoints.map((point) => (
            <span key={point} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/75">
              {point}
            </span>
          ))}
        </div>
        <p className="mt-3 text-white/50">
          {parking.ai?.predictiveAvailability || "Stable availability"}
        </p>
        {parking.ai?.traffic ? (
          <p className="mt-2 text-white/60">
            Route suggestion: {parking.ai.traffic.routeSummary || "Fastest route with current traffic considered"}.
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-white/55">
          Rating {parking.rating?.toFixed?.(1) || parking.rating} | {parking.ratingCount || 0} reviews
        </div>
        <button
          type="button"
          disabled={parking.availableSlots <= 0 || bookingId === parking._id}
          onClick={onBook}
          className="app-button-primary rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {bookingId === parking._id
            ? "Processing..."
            : parking.availableSlots <= 0
              ? "Full"
              : "Pay & Book"}
        </button>
      </div>
    </Motion.div>
  );
}

export default ParkingCard;
