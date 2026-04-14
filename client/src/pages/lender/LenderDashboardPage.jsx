import { BrainCircuit, CircleDollarSign, TimerReset } from "lucide-react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";

import MetricCard from "../../components/MetricCard";
import AIInsights from "../../components/mobility/AIInsights";
import EmptyStateCard from "../../components/ui/EmptyStateCard";
import SkeletonPanel from "../../components/ui/SkeletonPanel";

function ExpandableSection({ eyebrow, title, subtitle, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className="group app-surface rounded-[30px] p-6">
      <summary className="cursor-pointer list-none">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-soft)]">{eyebrow}</p>
        ) : null}
        <h3 className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">{title}</h3>
        {subtitle ? <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">{subtitle}</p> : null}
      </summary>
      <div className="mt-6">{children}</div>
    </details>
  );
}

function LenderDashboardPage() {
  const workspace = useOutletContext();
  const navigate = useNavigate();

  if (workspace.loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SkeletonPanel className="h-32" />
          <SkeletonPanel className="h-32" />
          <SkeletonPanel className="h-32" />
          <SkeletonPanel className="h-32" />
        </div>
        <SkeletonPanel className="h-80" />
      </div>
    );
  }

  const sensorOverview = workspace.iotOverview[0]?.sensorStatus || { online: 0, syncing: 0, offline: 0 };
  const recentBookings = workspace.bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Today Revenue" value={`Rs. ${workspace.todayRevenue}`} accent="role" helper="Live daily take" />
        <MetricCard label="Weekly Revenue" value={`Rs. ${workspace.weeklyRevenue}`} accent="blue" helper="Last 7 days" />
        <MetricCard label="Occupancy" value={`${workspace.occupancyRate}%`} accent="role" helper="Portfolio utilization" />
        <MetricCard label="Active Slots" value={workspace.activeSlots} accent="blue" helper="Available inventory right now" />
      </div>

      <div className="app-accent-panel rounded-[30px] p-6 text-white">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">Lender workspace</p>
        <h3 className="mt-2 text-3xl font-semibold">Revenue, occupancy, and AI guidance</h3>
        <p className="mt-3 max-w-3xl text-sm text-white/80">
          The dashboard now focuses on business health first, while deeper operational controls stay in parkings, bookings, and analytics.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="app-surface rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CircleDollarSign className="text-sky-200" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200/70">Revenue activity</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Recent bookings</h3>
              </div>
            </div>
            <Link to="/lender/bookings" className="app-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold">
              View all bookings
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {recentBookings.length ? (
              recentBookings.map((booking) => (
                <div key={booking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{booking.parkingTitle}</p>
                      <p className="mt-2 text-sm text-white/60">{new Date(booking.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right text-sm text-white/70">
                      <p>Rs. {booking.amount}</p>
                      <p className="mt-1">{booking.status}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyStateCard
                eyebrow="Bookings"
                title="No bookings yet"
                description="As soon as users start reserving your spaces, the latest booking activity will appear here."
                actionLabel="Manage Parkings"
                onAction={() => navigate("/lender/parkings")}
                icon={<CircleDollarSign size={18} />}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="app-surface rounded-[30px] p-6">
            <div className="flex items-center gap-3">
              <BrainCircuit className="text-sky-200" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200/70">AI insights</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Highest-priority guidance</h3>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {workspace.insights.slice(0, 3).map((insight) => (
                <div key={insight} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white/75">
                  {insight}
                </div>
              ))}
            </div>
          </div>

          <div className="app-surface rounded-[30px] p-6">
            <div className="flex items-center gap-3">
              <TimerReset className="text-sky-200" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200/70">Activity</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Operations snapshot</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white/75">
                Occupancy is currently {workspace.occupancyRate}% across your live portfolio.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white/75">
                Sensor status: {sensorOverview.online || 0} online | {sensorOverview.syncing || 0} syncing | {sensorOverview.offline || 0} offline
              </div>
              {(workspace.summary.alerts || []).slice(0, 2).map((alert) => (
                <div key={`${alert.title}-${alert.message}`} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="font-medium text-white">{alert.title}</p>
                  <p className="mt-2 text-sm text-white/60">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ExpandableSection
        eyebrow="Advanced"
        title="Expanded Forecasts"
        subtitle="Detailed mobility and demand forecasting stay available here without cluttering the main dashboard."
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <AIInsights
            title="Demand forecast"
            subtitle="Forward-looking mobility signals for the next operating window."
            items={[
              workspace.mobilityForecast.message || "Forecast unavailable.",
              `Demand level: ${workspace.mobilityForecast.demandLevel || "Low"}`,
              `Demand score: ${workspace.mobilityForecast.demandScore || 0}/100`,
            ]}
          />
          <AIInsights
            title="Trip performance"
            subtitle="Mobility usage performance layered on top of parking analytics."
            items={[
              `Completed trips: ${workspace.tripPerformance.completedTrips || 0}`,
              `Mobility revenue: Rs. ${workspace.tripPerformance.revenue || 0}`,
              `Average trust rating: ${workspace.tripPerformance.averageRating || 0}/5`,
              workspace.tripPerformance.peakHours?.length
                ? `Peak hours: ${workspace.tripPerformance.peakHours.map((hour) => `${String(hour).padStart(2, "0")}:00`).join(", ")}`
                : "Peak-hour profile is still collecting activity.",
            ]}
          />
        </div>
      </ExpandableSection>
    </div>
  );
}

export default LenderDashboardPage;
