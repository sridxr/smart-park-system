import { Compass, MapPin, Sparkles, Zap } from "lucide-react";
import { motion as Motion } from "framer-motion";

function getGreetingLabel() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 17) {
    return "Good Afternoon";
  }

  if (hour < 22) {
    return "Good Evening";
  }

  return "Good Night";
}

function DashboardHero({ userName, leadParking, onParkForMe, onExplore }) {
  const greeting = getGreetingLabel();
  const distance =
    leadParking?.ai?.distanceKm !== null && leadParking?.ai?.distanceKm !== undefined
      ? `${Math.max(1, Math.round(Number(leadParking.ai.distanceKm) * 1000))}m`
      : "Nearby";
  const price = leadParking?.dynamicPrice || leadParking?.fare || 0;
  const slots = leadParking?.availableSlots || 0;

  return (
    <Motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="app-hero-panel overflow-hidden rounded-[34px] border border-white/10 p-6 md:p-7"
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--app-text-muted)]">
            <Sparkles size={14} className="text-[var(--role-accent)]" />
            AI Hero Experience
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[color:var(--app-text)] md:text-5xl">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-[var(--role-primary)] to-[var(--role-accent)] bg-clip-text text-transparent">
              {userName || "Driver"}
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--app-text-muted)]">
            {leadParking
              ? "SmartPark AI found the best next stop based on price, distance, live availability, and your booking habits."
              : "Your personalized parking cockpit is ready. Explore the network or let SmartPark AI find the best option for you."}
          </p>

          {leadParking ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-100">
                {distance}
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                Rs. {price}
              </span>
              <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-100">
                {slots} slots
              </span>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onParkForMe}
              className="app-button-primary w-full rounded-2xl px-5 py-3 text-sm font-semibold sm:w-auto"
            >
              Park for Me
            </button>
            <button
              type="button"
              onClick={onExplore}
              className="app-button-secondary w-full rounded-2xl px-5 py-3 text-sm font-semibold sm:w-auto"
            >
              Explore Nearby
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:w-[420px] xl:grid-cols-1">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/45 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[var(--role-accent)]">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-muted)]">Best Parking Found</p>
                <p className="mt-1 font-medium text-[color:var(--app-text)]">
                  {leadParking?.title || "Waiting for live signal"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-950/45 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[var(--role-primary)]">
                <Zap size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-muted)]">Decision Mode</p>
                <p className="mt-1 font-medium text-[color:var(--app-text)]">Balanced AI routing</p>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-950/45 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[var(--role-primary)]">
                <Compass size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-muted)]">Next Action</p>
                <p className="mt-1 font-medium text-[color:var(--app-text)]">One-tap booking ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Motion.section>
  );
}

export default DashboardHero;
