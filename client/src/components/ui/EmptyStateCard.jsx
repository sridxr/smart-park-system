import { motion as Motion } from "framer-motion";

function EmptyStateCard({
  eyebrow = "Nothing here yet",
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = "",
}) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`app-empty-state rounded-[28px] p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--role-primary)]">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-muted)]">{eyebrow}</p>
          <h3 className="mt-3 text-xl font-semibold text-[color:var(--app-text)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--app-text-muted)]">{description}</p>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="app-button-primary mt-5 rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </Motion.div>
  );
}

export default EmptyStateCard;
