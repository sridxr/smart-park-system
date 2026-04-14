import { useOutletContext } from "react-router-dom";

function AdminAlertsPage() {
  const workspace = useOutletContext();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <h3 className="text-xl font-semibold text-white">System alerts</h3>
          <div className="mt-4 space-y-3">
            {(workspace.stats.systemAlerts || []).map((alert) => (
              <div key={alert} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white/75">
                {alert}
              </div>
            ))}
            {!workspace.stats.systemAlerts?.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-white/50">
                No system-wide alerts are active right now.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <h3 className="text-xl font-semibold text-white">Demand zones and suggested actions</h3>
          <div className="mt-4 space-y-3">
            {(workspace.stats.demandZones || []).map((zone) => (
              <div key={zone.location} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{zone.location}</p>
                  <p className="text-sm text-violet-200">{zone.bookings} bookings</p>
                </div>
                <p className="mt-2 text-sm text-white/60">Revenue Rs. {zone.revenue}</p>
              </div>
            ))}
            {(workspace.stats.decisionInsights || []).map((insight) => (
              <div key={insight} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white/75">
                {insight}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-white">Fraud detection</h3>
              <p className="mt-1 text-sm text-white/55">Suspicious booking and cancellation patterns</p>
            </div>
            <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-violet-100">
              {workspace.openFraudLogs.length} open
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {workspace.fraudLogs.slice(0, 6).map((log) => (
              <div key={log._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{log.user?.name || log.email}</p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
                    {log.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/65">{log.message}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/40">{log.type}</p>
              </div>
            ))}
            {!workspace.fraudLogs.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-white/50">
                No suspicious activity has been flagged yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <h3 className="text-xl font-semibold text-white">System logs</h3>
          <p className="mt-1 text-sm text-white/55">Platform actions recorded for review and audit</p>
          <div className="mt-4 space-y-3">
            {workspace.systemLogs.slice(0, 8).map((log) => (
              <div key={log._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{log.description || log.action}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/40">{log.action}</p>
                </div>
                <p className="mt-2 text-sm text-white/55">
                  {(log.actor?.name || log.actorEmail || "System")} | {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {!workspace.systemLogs.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-white/50">
                System activity will appear here as the platform is used.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAlertsPage;
