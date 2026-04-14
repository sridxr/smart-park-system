import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOutletContext } from "react-router-dom";

function LenderAnalyticsPage() {
  const workspace = useOutletContext();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h3 className="text-xl font-semibold text-white">Revenue trend</h3>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={workspace.summary.revenueSeries || []}>
              <defs>
                <linearGradient id="lenderRevenueModern" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
              <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="url(#lenderRevenueModern)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h3 className="text-xl font-semibold text-white">Peak hours by listing</h3>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workspace.listings.map((listing) => ({ name: listing.title.slice(0, 12), occupancy: listing.liveMetrics?.occupancyRate || 0 }))}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
              <Bar dataKey="occupancy" fill="#34d399" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default LenderAnalyticsPage;
