import { motion as Motion } from "framer-motion";

function MetricCard({ label, value, accent = "emerald", helper }) {
  const accentClasses = {
    emerald: "from-emerald-400/25 to-emerald-500/10 text-emerald-200",
    blue: "from-sky-400/25 to-blue-500/10 text-sky-200",
    violet: "from-violet-400/25 to-fuchsia-500/10 text-violet-200",
    role: "from-[rgba(var(--role-primary-rgb),0.2)] to-[rgba(var(--role-accent-rgb),0.1)] text-[color:var(--app-text)]",
  };

  return (
    <Motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className={`metric-card rounded-3xl border border-white/10 bg-gradient-to-br ${accentClasses[accent]} backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(4,12,24,0.4)]`}
    >
      <p className="metric-card-label text-sm text-[color:var(--app-text-muted)]">{label}</p>
      <h3 className="metric-card-value mt-3 text-3xl font-semibold text-[color:var(--app-text)]">{value}</h3>
      {helper ? <p className="metric-card-helper mt-2 text-sm text-[color:var(--app-text-muted)]">{helper}</p> : null}
    </Motion.div>
  );
}

export default MetricCard;
