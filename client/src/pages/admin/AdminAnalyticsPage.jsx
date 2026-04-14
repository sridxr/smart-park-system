import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOutletContext } from "react-router-dom";

import MetricCard from "../../components/MetricCard";

const roleColors = ["#a78bfa", "#38bdf8", "#34d399"];

function AdminAnalyticsPage() {
  const workspace = useOutletContext();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Revenue" value={`Rs. ${workspace.advancedAnalytics.totalRevenue}`} accent="violet" helper="Platform gross revenue" />
        <MetricCard label="Peak Hours" value={workspace.advancedAnalytics.peakHours.map((hour) => `${hour}:00`).join(", ") || "N/A"} accent="blue" helper="Demand prediction window" />
        <MetricCard label="Avg Duration" value={`${workspace.advancedAnalytics.averageParkingDuration} mins`} accent="emerald" helper="Estimated average stay" />
        <MetricCard label="Conversion Rate" value={`${workspace.advancedAnalytics.conversionRate}%`} accent="violet" helper="Bookings per registered user" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h3 className="text-xl font-semibold text-white">Revenue trend</h3>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={workspace.stats.revenueTrend || []}>
              <defs>
                <linearGradient id="adminRevenueModern" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
              <Area type="monotone" dataKey="value" stroke="#a78bfa" fill="url(#adminRevenueModern)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h3 className="text-xl font-semibold text-white">Role distribution</h3>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={workspace.stats.roleDistribution || []} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={3}>
                {(workspace.stats.roleDistribution || []).map((entry, index) => (
                  <Cell key={entry.name} fill={roleColors[index % roleColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl xl:col-span-2">
        <h3 className="text-xl font-semibold text-white">Booking velocity</h3>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workspace.stats.bookingTrend || []}>
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
    </div>
  );
}

export default AdminAnalyticsPage;
