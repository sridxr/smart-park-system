import { Bot, CheckCircle2, XCircle } from "lucide-react";

function ZeroClickParkingCard({ suggestion, onConfirm, onDismiss }) {
  return (
    <div className="app-accent-panel rounded-[30px] p-6 text-white">
      <div className="flex items-center gap-3">
        <Bot className="text-sky-100" />
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">Zero-click parking</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{suggestion?.statusMessage || "Zero-click suggestion"}</h3>
        </div>
      </div>

      <p className="mt-4 text-sm text-white/85">
        {suggestion?.explanation || "AI can suggest a destination-aware parking option before you manually search."}
      </p>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
        <p className="font-medium text-white">{suggestion?.parking?.title || "No auto-suggested parking yet"}</p>
        <p className="mt-2 text-sm text-white/70">
          {suggestion?.predictedDestination?.label || "Unknown destination"} | Rs. {suggestion?.parking?.dynamicPrice || suggestion?.parking?.fare || 0} | ETA {suggestion?.parking?.ai?.traffic?.eta || "Live"}
        </p>
        <p className="mt-2 text-xs text-white/60">{suggestion?.confidence || 0}% confidence</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onConfirm} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={16} />
            {suggestion?.confirmLabel || "Confirm"}
          </span>
        </button>
        <button type="button" onClick={onDismiss} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
          <span className="inline-flex items-center gap-2">
            <XCircle size={16} />
            {suggestion?.cancelLabel || "Cancel"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default ZeroClickParkingCard;
