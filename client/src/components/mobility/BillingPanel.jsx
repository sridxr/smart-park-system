import { Clock3, ReceiptText } from "lucide-react";

function BillingPanel({ billing }) {
  if (!billing) {
    return null;
  }

  return (
    <div className="app-surface rounded-[30px] p-6">
      <div className="flex items-center gap-3">
        <ReceiptText className="text-[var(--role-accent)]" />
        <div>
          <h3 className="text-xl font-semibold text-[color:var(--app-text)]">Real-time billing</h3>
          <p className="text-sm text-[color:var(--app-text-muted)]">Usage-based billing updates while the trip is active.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-[color:var(--app-text-muted)]">Duration</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">{billing.durationMinutes || 0} min</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-[color:var(--app-text-muted)]">Rate</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">Rs. {billing.ratePerHour || 0}/hr</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-[color:var(--app-text-muted)]">Current total</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">Rs. {billing.totalPrice || 0}</p>
        </div>
      </div>

      {billing.remainingMinutes > 0 ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
          <Clock3 size={14} />
          {billing.remainingMinutes} min remaining
        </div>
      ) : null}
    </div>
  );
}

export default BillingPanel;
