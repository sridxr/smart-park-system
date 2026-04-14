import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, LogOut, Shield } from "lucide-react";
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

import API from "../api";
import MapPanel from "../components/MapPanel";
import MetricCard from "../components/MetricCard";
import { useAuth } from "../context/AuthContext";
import { getRealtimeSocket } from "../lib/realtime";

const roleColors = ["#a78bfa", "#38bdf8", "#34d399"];

function AdminDashboard() {
  const { session, user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalParkings: 0,
    revenue: 0,
    busiestLocations: [],
    peakHours: [],
    roleDistribution: [],
    revenueTrend: [],
    bookingTrend: [],
    demandZones: [],
    decisionInsights: [],
    systemAlerts: [],
  });
  const [users, setUsers] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const usersRes = await API.get("/users");
      setUsers(usersRes.data);
    } catch (err) {
      setMessage(err.response?.data?.msg || "Could not refresh the user list");
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const [statsRes, parkingsRes, bookingsRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/parkings"),
        API.get("/admin/bookings"),
      ]);

      setStats(statsRes.data);
      setParkings(parkingsRes.data);
      setBookings(bookingsRes.data);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Could not load admin intelligence");
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
      void fetchUsers();
    }, 0);
    const usersIntervalId = window.setInterval(() => {
      void fetchUsers();
    }, 10000);
    const intervalId = window.setInterval(() => {
      void loadDashboard();
    }, 60000);
    const handleFocus = () => {
      void fetchUsers();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(usersIntervalId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchUsers, loadDashboard]);

  useEffect(() => {
    const socket = getRealtimeSocket(session?.token);
    if (!socket) {
      return undefined;
    }

    const handleDashboardRefresh = () => {
      void loadDashboard();
    };
    const handleUserRefresh = () => {
      void fetchUsers();
      void loadDashboard();
    };

    socket.on("parking:changed", handleDashboardRefresh);
    socket.on("booking:changed", handleDashboardRefresh);
    socket.on("user:changed", handleUserRefresh);

    return () => {
      socket.off("parking:changed", handleDashboardRefresh);
      socket.off("booking:changed", handleDashboardRefresh);
      socket.off("user:changed", handleUserRefresh);
    };
  }, [fetchUsers, loadDashboard, session?.token]);

  const toggleUserStatus = async (selectedUser) => {
    try {
      await API.patch(`/admin/users/${selectedUser._id}/status`, {
        status: selectedUser.status === "blocked" ? "active" : "blocked",
      });
      await Promise.all([loadDashboard(), fetchUsers()]);
    } catch (err) {
      setMessage(err.response?.data?.msg || "Could not update user state");
    }
  };

  const deleteUser = async (userId) => {
    try {
      await API.delete(`/admin/users/${userId}`);
      await Promise.all([loadDashboard(), fetchUsers()]);
    } catch (err) {
      setMessage(err.response?.data?.msg || "Could not delete this user");
    }
  };

  const blockedUsers = useMemo(
    () => users.filter((row) => row.status === "blocked").length,
    [users]
  );

  const activeHighDemandParkings = useMemo(
    () =>
      parkings.filter(
        (parking) =>
          parking.demandLevel === "High" ||
          parking.liveMetrics?.occupancyRate >= 80 ||
          parking.availableSlots <= 2
      ).length,
    [parkings]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.22),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_20%),#020617] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-violet-300/70">Admin Control Room</p>
            <h1 className="mt-2 text-4xl font-semibold">Platform Operations | {user.name}</h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              Moderate users, inspect platform health, spot demand spikes, and steer SmartPark AI with confidence.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
          >
            <LogOut className="mr-2 inline-block" size={16} />
            Logout
          </button>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-50">
            {message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <MetricCard label="Users" value={stats.totalUsers} accent="violet" helper="All platform accounts" />
          <MetricCard label="Bookings" value={stats.totalBookings} accent="violet" helper="Network transaction volume" />
          <MetricCard label="Parkings" value={stats.totalParkings} accent="blue" helper="Published inventory" />
          <MetricCard label="Revenue" value={`Rs. ${stats.revenue}`} accent="emerald" helper="Gross booking value" />
          <MetricCard label="Risk Alerts" value={activeHighDemandParkings + blockedUsers} accent="violet" helper="Demand and governance pressure" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {(stats.systemAlerts || []).slice(0, 3).map((alert) => (
            <div
              key={alert}
              className="rounded-[28px] border border-violet-400/15 bg-violet-400/10 p-4 backdrop-blur-2xl"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 text-violet-200" size={18} />
                <p className="text-sm text-violet-50">{alert}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-violet-200" />
                <div>
                  <h2 className="text-2xl font-semibold">AI Decision Panel</h2>
                  <p className="text-sm text-white/55">Suggested actions from live platform telemetry</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {(stats.decisionInsights || []).map((insight) => (
                  <div key={insight} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white/75">
                    {insight}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white/70">
                Peak Hours: {stats.peakHours?.length ? stats.peakHours.map((hour) => `${hour}:00`).join(", ") : "No data yet"}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <h3 className="text-xl font-semibold text-white">Demand Heat Zones</h3>
              <div className="mt-4 space-y-3">
                {(stats.demandZones || []).map((zone) => (
                  <div key={zone.location} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{zone.location}</p>
                      <p className="text-sm text-violet-200">{zone.bookings} bookings</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-sky-400"
                        style={{
                          width: `${Math.min(100, zone.bookings * 16)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-white/55">Revenue Rs. {zone.revenue}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <h3 className="text-xl font-semibold text-white">Demand Heatmap</h3>
              <p className="mt-2 text-sm text-white/55">
                Red zones indicate high booking pressure, green zones indicate lower demand.
              </p>
              <div className="mt-5">
                <MapPanel markers={parkings} height="340px" showHeatmap showLegend />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
                <h3 className="text-xl font-semibold text-white">Revenue Trend</h3>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.revenueTrend || []}>
                      <defs>
                        <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          background: "#020617",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 16,
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#a78bfa" fill="url(#adminRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
                <h3 className="text-xl font-semibold text-white">Role Mix</h3>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.roleDistribution || []}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={3}
                      >
                        {(stats.roleDistribution || []).map((entry, index) => (
                          <Cell key={entry.name} fill={roleColors[index % roleColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#020617",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 16,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <Shield className="text-violet-200" />
                <div>
                  <h2 className="text-2xl font-semibold">Booking Velocity</h2>
                  <p className="text-sm text-white/55">Daily booking volume across the network</p>
                </div>
              </div>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.bookingTrend || []}>
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: "#020617",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 16,
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <Shield className="text-violet-200" />
                <div>
                  <h2 className="text-2xl font-semibold">User Governance</h2>
                  <p className="text-sm text-white/55">Block or remove accounts directly from the admin layer</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {users.slice(0, 8).map((row) => (
                  <div key={row._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{row.name}</p>
                        <p className="mt-1 text-sm text-white/55">{row.email} | {row.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(row)}
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                        >
                          {row.status === "blocked" ? "Unblock" : "Block"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(row._id)}
                          className="rounded-2xl bg-violet-300 px-3 py-2 text-xs font-semibold text-slate-950"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
                <h3 className="text-xl font-semibold text-white">Parkings</h3>
                <div className="mt-4 space-y-3">
                  {parkings.slice(0, 5).map((parking) => (
                    <div key={parking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm">
                      <p className="font-medium text-white">{parking.title}</p>
                      <p className="mt-2 text-white/60">
                        {parking.owner?.name || "No owner"} | {parking.demandLevel}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
                <h3 className="text-xl font-semibold text-white">Bookings</h3>
                <div className="mt-4 space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm">
                      <p className="font-medium text-white">{booking.parkingTitle}</p>
                      <p className="mt-2 text-white/60">
                        {booking.user?.email || booking.userEmail} | Rs. {booking.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
