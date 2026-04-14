import { MapPinned, Navigation, ParkingCircle, TimerReset } from "lucide-react";
import { motion as Motion } from "framer-motion";

const statusMeta = {
  navigating: { label: "Navigating", icon: Navigation },
  arrived: { label: "Arrived", icon: MapPinned },
  parked: { label: "Parked", icon: ParkingCircle },
  completed: { label: "Completed", icon: TimerReset },
};

function TripStatus({
  trip,
  onAdvance,
  onExtend,
  onComplete,
}) {
  if (!trip) {
    return null;
  }

  const meta = statusMeta[trip.status] || statusMeta.navigating;
  const Icon = meta.icon;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="app-surface rounded-[30px] p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-muted)]">Trip mode</p>
          <h3 className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">
            {trip.parking?.title || "Active trip"}
          </h3>
          <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">
            {trip.parking?.address?.area}
            {trip.parking?.address?.district ? `, ${trip.parking.address.district}` : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[color:var(--app-text)]">
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-[var(--role-primary)]" />
            {meta.label}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-[color:var(--app-text-muted)]">ETA</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
            {trip.latestEtaMinutes ? `${trip.latestEtaMinutes} min` : "Live"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-[color:var(--app-text-muted)]">Traffic delay</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
            +{trip.latestTrafficDelayMinutes || 0} min
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-[color:var(--app-text-muted)]">Route quality</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">{trip.routeQuality || "Unknown"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-[color:var(--app-text-muted)]">Vehicle</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
            {trip.vehicle?.label || "Default"}
          </p>
        </div>
      </div>

      {trip.status === "navigating" ? (
        <p className="mt-4 rounded-2xl border border-sky-400/15 bg-sky-500/[0.06] px-4 py-3 text-sm text-sky-100">
          Trip mode is watching your GPS. When you are within 50 meters, arrival is detected automatically.
        </p>
      ) : null}

      {trip.rerouteSuggestion?.message ? (
        <p className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-100">
          {trip.rerouteSuggestion.message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {trip.status === "navigating" ? (
          <button type="button" onClick={() => onAdvance?.("arrived")} className="app-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold">
            Mark Arrived
          </button>
        ) : null}
        {trip.status === "arrived" ? (
          <button type="button" onClick={() => onAdvance?.("parked")} className="app-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold">
            Start Parking
          </button>
        ) : null}
        {trip.status === "parked" ? (
          <>
            <button type="button" onClick={() => onExtend?.(30)} className="app-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold">
              Extend by 30 mins
            </button>
            <button type="button" onClick={onComplete} className="app-button-primary rounded-2xl px-4 py-3 text-sm font-semibold">
              End Session
            </button>
          </>
        ) : null}
      </div>
    </Motion.div>
  );
}

export default TripStatus;
