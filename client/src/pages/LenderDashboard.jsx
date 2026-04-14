import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  LogOut,
  MapPinHouse,
  Radar,
  TrendingUp,
} from "lucide-react";
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
import SlotGrid from "../components/SlotGrid";
import { useAuth } from "../context/AuthContext";
import { getRealtimeSocket } from "../lib/realtime";

const chartColors = ["#38bdf8", "#34d399", "#f59e0b", "#a78bfa", "#fb7185"];

function createInitialForm() {
  return {
    title: "",
    description: "",
    address: {
      fullText: "",
      area: "",
      district: "",
      state: "",
      city: "",
      country: "India",
    },
    location: {
      lat: 13.0827,
      lng: 80.2707,
    },
    fare: 120,
    totalSlots: 20,
    availableSlots: 20,
    parkingSize: "medium",
    allowedCars: ["sedan"],
    amenities: ["CCTV", "Covered"],
  };
}

function LenderDashboard() {
  const { session, user, logout } = useAuth();
  const [form, setForm] = useState(createInitialForm);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({
    totalBookings: 0,
    bookingsToday: 0,
    revenue: 0,
    revenueSeries: [],
    bookingSeries: [],
    insights: [],
    alerts: [],
  });
  const [insights, setInsights] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoDynamicPricing, setAutoDynamicPricing] = useState(true);
  const [selectedListingId, setSelectedListingId] = useState("");
  const [editingListingId, setEditingListingId] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const [listingRes, summaryRes, insightRes, bookingRes] = await Promise.all([
        API.get("/parking/mine"),
        API.get("/booking/summary/lender"),
        API.get("/ai/insights/lender"),
        API.get("/booking/mine"),
      ]);

      setListings(listingRes.data);
      setSummary(summaryRes.data);
      setInsights([
        ...(summaryRes.data.insights || []),
        ...((insightRes.data.insights || []).filter(
          (insight) => !(summaryRes.data.insights || []).includes(insight)
        )),
      ]);
      setBookings(bookingRes.data);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Could not load the lender workspace");
    }
  }, []);

  useEffect(() => {
    if (!selectedListingId && listings[0]?._id) {
      setSelectedListingId(listings[0]._id);
    }
  }, [listings, selectedListingId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    const intervalId = window.setInterval(() => {
      void loadDashboard();
    }, 60000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadDashboard]);

  useEffect(() => {
    const socket = getRealtimeSocket(session?.token);
    if (!socket) {
      return undefined;
    }

    const handleRealtimeRefresh = () => {
      void loadDashboard();
    };

    socket.on("parking:changed", handleRealtimeRefresh);
    socket.on("booking:changed", handleRealtimeRefresh);

    return () => {
      socket.off("parking:changed", handleRealtimeRefresh);
      socket.off("booking:changed", handleRealtimeRefresh);
    };
  }, [loadDashboard, session?.token]);

  const occupancyRate = useMemo(() => {
    if (!listings.length) {
      return 0;
    }

    const ratios = listings.map((listing) =>
      listing.totalSlots
        ? Math.round(((listing.totalSlots - listing.availableSlots) / listing.totalSlots) * 100)
        : 0
    );

    return Math.round(ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length);
  }, [listings]);

  const activeSlots = useMemo(
    () => listings.reduce((sum, listing) => sum + (listing.availableSlots || 0), 0),
    [listings]
  );

  const weeklyRevenue = useMemo(
    () => (summary.revenueSeries || []).reduce((sum, entry) => sum + (entry.value || 0), 0),
    [summary.revenueSeries]
  );

  const todayRevenue = useMemo(
    () => summary.revenueSeries?.[summary.revenueSeries.length - 1]?.value || 0,
    [summary.revenueSeries]
  );

  const occupancyMix = useMemo(() => {
    const occupied = listings.reduce(
      (sum, listing) => sum + Math.max(0, (listing.totalSlots || 0) - (listing.availableSlots || 0)),
      0
    );
    const available = listings.reduce((sum, listing) => sum + (listing.availableSlots || 0), 0);

    return [
      { name: "Occupied", value: occupied },
      { name: "Available", value: available },
    ];
  }, [listings]);

  const utilizationByListing = useMemo(
    () =>
      listings.map((listing) => ({
        name: listing.title.length > 16 ? `${listing.title.slice(0, 16)}...` : listing.title,
        occupancy: listing.liveMetrics?.occupancyRate || 0,
        dynamicPrice: listing.dynamicPrice || listing.fare,
      })),
    [listings]
  );

  const pricingOpportunities = useMemo(
    () =>
      listings
        .map((listing) => ({
          ...listing,
          delta: Number(listing.dynamicPrice || 0) - Number(listing.fare || 0),
        }))
        .sort((left, right) => right.delta - left.delta)
        .slice(0, 3),
    [listings]
  );

  const previewDynamicPrice = useMemo(() => {
    const occupancyPressure = form.totalSlots
      ? ((form.totalSlots - form.availableSlots) / form.totalSlots) * 100
      : 0;

    if (!autoDynamicPricing) {
      return form.fare;
    }

    if (occupancyPressure >= 60) {
      return Math.round(form.fare * 1.18);
    }

    if (occupancyPressure >= 35) {
      return Math.round(form.fare * 1.1);
    }

    return Math.max(50, Math.round(form.fare * 0.96));
  }, [autoDynamicPricing, form.availableSlots, form.fare, form.totalSlots]);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing._id === selectedListingId) || listings[0] || null,
    [listings, selectedListingId]
  );

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNestedChange = (group, key, value) => {
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }));
  };

  const handleLocationChange = (location) => {
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        fullText: location.fullText || prev.address.fullText,
      },
      location: {
        lat: location.lat,
        lng: location.lng,
      },
    }));
  };

  const toggleArrayValue = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  const resetEditor = useCallback(() => {
    setEditingListingId("");
    setForm(createInitialForm());
    setAutoDynamicPricing(true);
  }, []);

  const loadSelectedIntoEditor = useCallback(() => {
    if (!selectedListing) {
      return;
    }

    setEditingListingId(selectedListing._id);
    setForm({
      title: selectedListing.title || "",
      description: selectedListing.description || "",
      address: {
        fullText: selectedListing.address?.fullText || "",
        area: selectedListing.address?.area || "",
        district: selectedListing.address?.district || "",
        state: selectedListing.address?.state || "",
        city: selectedListing.address?.city || "",
        country: selectedListing.address?.country || "India",
      },
      location: {
        lat: selectedListing.location?.lat || 13.0827,
        lng: selectedListing.location?.lng || 80.2707,
      },
      fare: Number(selectedListing.fare || 120),
      totalSlots: Number(selectedListing.totalSlots || 20),
      availableSlots: Number(selectedListing.availableSlots || 20),
      parkingSize: selectedListing.parkingSize || "medium",
      allowedCars: selectedListing.allowedCars || ["sedan"],
      amenities: selectedListing.amenities || ["CCTV", "Covered"],
    });
    setAutoDynamicPricing(
      Number(selectedListing.dynamicPrice || selectedListing.fare) !== Number(selectedListing.fare)
    );
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [selectedListing]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        dynamicPrice: previewDynamicPrice,
      };
      const response = await (editingListingId
        ? API.patch(`/parking/${editingListingId}`, payload)
        : API.post("/parking/add", payload));

      await loadDashboard();
      setSelectedListingId(response.data?._id || selectedListingId);
      setMessage(
        editingListingId
          ? "Parking asset updated successfully"
          : "Parking asset added successfully"
      );
      resetEditor();
    } catch (err) {
      setMessage(
        err.response?.data?.msg ||
          (editingListingId
            ? "Could not update this parking asset"
            : "Could not create this parking asset")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.20),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.10),_transparent_20%),#020617] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300/70">Lender Console</p>
            <h1 className="mt-2 text-4xl font-semibold">{user.name}&apos;s Parking Portfolio</h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              Inventory control, slot intelligence, pricing optimization, and map-led onboarding.
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

        <div className="mt-8 grid gap-4 md:grid-cols-6">
          <MetricCard label="Listings" value={listings.length} accent="blue" helper="Live supply under management" />
          <MetricCard label="Today Revenue" value={`Rs. ${todayRevenue}`} accent="emerald" helper="Realized booking value today" />
          <MetricCard label="Weekly Revenue" value={`Rs. ${weeklyRevenue}`} accent="blue" helper="Rolling 7-day earnings view" />
          <MetricCard label="Active Slots" value={activeSlots} accent="emerald" helper="Immediately sellable parking inventory" />
          <MetricCard label="Bookings Today" value={summary.bookingsToday} accent="blue" helper="Fresh operational traction" />
          <MetricCard label="Occupancy" value={`${occupancyRate}%`} accent="emerald" helper="Average network utilization" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {(summary.alerts || []).slice(0, 3).map((alert) => (
            <div
              key={`${alert.title}-${alert.message}`}
              className="rounded-[28px] border border-sky-400/15 bg-sky-400/10 p-4 backdrop-blur-2xl"
            >
              <p className="text-sm font-medium text-sky-50">{alert.title}</p>
              <p className="mt-2 text-sm text-sky-100/80">{alert.message}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MapPinHouse className="text-sky-200" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-sky-300/70">Management Layer</p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      {editingListingId ? "Edit a live inventory listing" : "Create a real inventory listing"}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetEditor}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
                >
                  Reset
                </button>
              </div>

              {editingListingId ? (
                <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-50">
                  Editing the selected parking asset. Save changes to update the live listing.
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                  placeholder="Parking title"
                  value={form.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                />
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                  placeholder="Description"
                  value={form.description}
                  onChange={(event) => handleChange("description", event.target.value)}
                />
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                  placeholder="Area"
                  value={form.address.area}
                  onChange={(event) => handleNestedChange("address", "area", event.target.value)}
                />
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                  placeholder="District"
                  value={form.address.district}
                  onChange={(event) => handleNestedChange("address", "district", event.target.value)}
                />
                <input
                  type="number"
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                  placeholder="Fare"
                  value={form.fare}
                  onChange={(event) => handleChange("fare", Number(event.target.value))}
                />
                <input
                  type="number"
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                  placeholder="Total slots"
                  value={form.totalSlots}
                  onChange={(event) => {
                    const totalSlots = Number(event.target.value);
                    setForm((prev) => ({
                      ...prev,
                      totalSlots,
                      availableSlots: Math.min(prev.availableSlots, totalSlots),
                    }));
                  }}
                />
                <select
                  value={form.parkingSize}
                  onChange={(event) => handleChange("parkingSize", event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
                <input
                  type="number"
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                  placeholder="Available slots"
                  value={form.availableSlots}
                  onChange={(event) => handleChange("availableSlots", Number(event.target.value))}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Auto Dynamic Pricing</p>
                    <p className="mt-1 text-sm text-white/55">
                      Recommended launch price Rs. {previewDynamicPrice} based on occupancy posture.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoDynamicPricing((prev) => !prev)}
                    className={`rounded-full px-4 py-2 text-sm ${
                      autoDynamicPricing
                        ? "bg-sky-300 text-slate-950"
                        : "border border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    {autoDynamicPricing ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm text-white/60">Allowed Car Types</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["hatchback", "sedan", "suv"].map((car) => (
                    <button
                      key={car}
                      type="button"
                      onClick={() => toggleArrayValue("allowedCars", car)}
                      className={`rounded-full px-4 py-2 text-sm ${
                        form.allowedCars.includes(car)
                          ? "bg-sky-300 text-slate-950"
                          : "border border-white/10 bg-white/5 text-white/70"
                      }`}
                    >
                      {car}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm text-white/60">Amenities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Covered", "CCTV", "EV", "Valet", "24/7"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayValue("amenities", item)}
                      className={`rounded-full px-4 py-2 text-sm ${
                        form.amenities.includes(item)
                          ? "bg-emerald-300 text-slate-950"
                          : "border border-white/10 bg-white/5 text-white/70"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <MapPanel
                  interactive
                  selectedLocation={{
                    ...form.location,
                    fullText: form.address.fullText,
                  }}
                  onLocationChange={handleLocationChange}
                  height="360px"
                />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white/65">
                <span>{form.address.fullText || "Click the map or search to capture the exact location"}</span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSubmit}
                  className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingListingId ? "Save Changes" : "Create Listing"}
                </button>
              </div>
            </div>

            {selectedListing?.slotLayout?.slots?.length ? (
              <SlotGrid
                slotLayout={selectedListing.slotLayout}
                title={`Smart Slot Grid${selectedListing ? ` | ${selectedListing.title}` : ""}`}
                helper="Auto-assigned occupancy grid driven by live bookings"
              />
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <BrainCircuit className="text-sky-200" />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-sky-300/70">AI Insights</p>
                  <h2 className="mt-1 text-2xl font-semibold">Revenue and occupancy strategy</h2>
                </div>
              </div>

              {message ? (
                <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-50">
                  {message}
                </div>
              ) : null}

              <div className="mt-5 space-y-3">
                {insights.map((insight) => (
                  <div key={insight} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white/75">
                    {insight}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-emerald-200" />
                  <div>
                    <h2 className="text-2xl font-semibold">Revenue Trend</h2>
                    <p className="text-sm text-white/55">7-day booking revenue movement</p>
                  </div>
                </div>
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.revenueSeries || []}>
                      <defs>
                        <linearGradient id="lenderRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
                      <Area type="monotone" dataKey="value" stroke="#34d399" fillOpacity={1} fill="url(#lenderRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <Radar className="text-sky-200" />
                  <div>
                    <h2 className="text-2xl font-semibold">Slot Mix</h2>
                    <p className="text-sm text-white/55">Available versus occupied inventory</p>
                  </div>
                </div>
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={occupancyMix} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={3}>
                        {occupancyMix.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-emerald-200" />
                  <div>
                    <h2 className="text-2xl font-semibold">Portfolio Overview</h2>
                    <p className="text-sm text-white/55">Live listings, pricing posture, and utilization</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadSelectedIntoEditor}
                  disabled={!selectedListing}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 disabled:opacity-50"
                >
                  Edit Selected
                </button>
              </div>

              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationByListing}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
                    <Bar dataKey="occupancy" fill="#38bdf8" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-5 space-y-3">
                {listings.map((listing) => {
                  const occupancy = listing.liveMetrics?.occupancyRate || 0;
                  return (
                    <button
                      key={listing._id}
                      type="button"
                      onClick={() => setSelectedListingId(listing._id)}
                      className={`block w-full rounded-2xl border bg-slate-950/70 p-4 text-left ${
                        selectedListingId === listing._id ? "border-sky-300/30" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-white">{listing.title}</p>
                          <p className="mt-2 text-sm text-white/55">
                            {listing.address?.area}, {listing.address?.district}
                          </p>
                        </div>
                        <div className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs text-sky-100">
                          {listing.demandLevel}
                        </div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-2xl bg-white/5 p-3">
                          <p className="text-white/40">Fare</p>
                          <p className="mt-2 text-white">Rs. {listing.fare}</p>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-3">
                          <p className="text-white/40">Dynamic</p>
                          <p className="mt-2 text-white">Rs. {listing.dynamicPrice}</p>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-3">
                          <p className="text-white/40">Availability</p>
                          <p className="mt-2 text-white">
                            {listing.availableSlots}/{listing.totalSlots}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <h3 className="text-xl font-semibold text-white">AI Suggestion Panel</h3>
              <div className="mt-4 space-y-3">
                {pricingOpportunities.map((listing) => (
                  <div key={listing._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="font-medium text-white">{listing.title}</p>
                    <p className="mt-2 text-sm text-white/60">
                      Dynamic uplift Rs. {Math.max(0, listing.delta)} | Peak hours:{" "}
                      {listing.peakHours?.length ? listing.peakHours.join(", ") : "Not enough data"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <h3 className="text-xl font-semibold text-white">Recent Bookings</h3>
              <div className="mt-4 space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="font-medium text-white">{booking.parkingTitle}</p>
                    <p className="mt-2 text-sm text-white/60">
                      Rs. {booking.amount} | {booking.status}
                      {booking.assignedSlotCode ? ` | Slot ${booking.assignedSlotCode}` : ""}
                    </p>
                  </div>
                ))}
                {!bookings.length ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-white/55">
                    Recent lender bookings will appear here as soon as reservations start flowing in.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LenderDashboard;
