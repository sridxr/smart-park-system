import { AlertTriangle, BarChart3, ChevronDown, ScrollText } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

import MapPanel from "../../components/MapPanel";
import MetricCard from "../../components/MetricCard";
import AIInsights from "../../components/mobility/AIInsights";

function ExpandableSection({ eyebrow, title, subtitle, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className="group app-surface rounded-[30px] p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-soft)]">{eyebrow}</p>
          ) : null}
          <h3 className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">{title}</h3>
          {subtitle ? <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">{subtitle}</p> : null}
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-[color:var(--app-text-muted)] transition group-open:rotate-180">
          <ChevronDown size={16} />
        </div>
      </summary>
      <div className="mt-6">{children}</div>
    </details>
  );
}

function AdminDashboardPage() {
  const workspace = useOutletContext();
  const riskAlerts =
    workspace.parkings.filter(
      (parking) =>
        parking.demandLevel === "High" ||
        parking.liveMetrics?.occupancyRate >= 80 ||
        parking.availableSlots <= 2
    ).length +
    workspace.blockedUsers +
    workspace.openFraudLogs.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-6">
        <MetricCard label="Users" value={workspace.stats.totalUsers} accent="role" helper="All platform accounts" />
        <MetricCard label="Bookings" value={workspace.stats.totalBookings} accent="role" helper="Network transaction volume" />
        <MetricCard label="Parkings" value={workspace.stats.totalParkings} accent="blue" helper="Published inventory" />
        <MetricCard label="Revenue" value={`Rs. ${workspace.stats.revenue}`} accent="emerald" helper="Gross booking value" />
        <MetricCard label="Fraud Flags" value={workspace.openFraudLogs.length} accent="role" helper="Open suspicious activity cases" />
        <MetricCard label="Risk Alerts" value={riskAlerts} accent="role" helper="Demand and governance pressure" />
      </div>

      <div className="app-accent-panel rounded-[30px] p-6 text-[color:var(--app-text)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-muted)]">Admin control</p>
        <h3 className="mt-2 text-3xl font-semibold">System stats, alerts, analytics, and logs</h3>
        <p className="mt-3 max-w-3xl text-sm text-[color:var(--app-text-muted)]">
          The dashboard now keeps the highest-risk operational picture visible first, while deeper diagnostics stay one expansion away.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="app-surface rounded-[30px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-violet-200" />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-violet-200/70">Alerts</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">Priority alerts</h3>
                </div>
              </div>
              <Link to="/admin/alerts" className="app-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold">
                Open alerts
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {(workspace.stats.systemAlerts || []).slice(0, 3).map((alert) => (
                <div key={alert} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-[color:var(--app-text-muted)]">
                  {alert}
                </div>
              ))}
              {workspace.openFraudLogs.slice(0, 2).map((log) => (
                <div key={log._id} className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4 text-sm text-violet-100">
                  {log.message}
                </div>
              ))}
            </div>
          </div>

          <div className="app-surface rounded-[30px] p-6">
            <div className="flex items-center gap-3">
              <ScrollText className="text-violet-200" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-violet-200/70">Logs</p>
                <h3 className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">Latest system activity</h3>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {workspace.systemLogs.slice(0, 4).map((log) => (
                <div key={log._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-sm font-medium text-[color:var(--app-text)]">{log.description || log.action}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-muted)]">{log.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="app-surface rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-violet-200" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-violet-200/70">Analytics</p>
                <h3 className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">Demand heatmap</h3>
                <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">Map-first situational view for platform operations.</p>
              </div>
            </div>
            <Link to="/admin/analytics" className="app-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold">
              Open analytics
            </Link>
          </div>
          <div className="mt-5">
            <MapPanel markers={workspace.parkings} height="620px" showHeatmap showLegend />
          </div>
        </div>
      </div>

      <ExpandableSection
        eyebrow="Advanced"
        title="AI and mobility diagnostics"
        subtitle="Longer-form platform intelligence stays available here without crowding the main admin control center."
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <AIInsights
            title="AI insights panel"
            subtitle="Summary only, detailed analysis lives in analytics and alerts."
            items={[
              ...(workspace.stats.decisionInsights || []).slice(0, 4),
              ...workspace.openFraudLogs.slice(0, 1).map((log) => log.message),
            ]}
          />
          <AIInsights
            title="Mobility operations"
            subtitle="Platform-wide trip and journey performance."
            items={[
              `Active trips: ${workspace.mobilitySummary.activeTrips || 0}`,
              `Completed trips: ${workspace.mobilitySummary.completedTrips || 0}`,
              `Average trip duration: ${workspace.mobilitySummary.averageTripDurationMinutes || 0} min`,
              `Average rating: ${workspace.mobilitySummary.averageRating || 0}/5`,
            ]}
          />
        </div>
      </ExpandableSection>
    </div>
  );
}

export default AdminDashboardPage;
