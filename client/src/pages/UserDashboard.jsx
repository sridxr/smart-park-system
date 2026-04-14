import { useCallback, useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
  BellRing,
  Bot,
  Flame,
  Gauge,
  Layers3,
  LogOut,
  MapPinned,
  Route,
  Sparkles,
} from "lucide-react";

import API from "../api";
import AIChatAssistant from "../components/AIChatAssistant";
import MapPanel from "../components/MapPanel";
import MetricCard from "../components/MetricCard";
import ParkingCard from "../components/ParkingCard";
import PaymentModal from "../components/PaymentModal";
import { useAuth } from "../context/AuthContext";
import { getRealtimeSocket } from "../lib/realtime";

const recommendationModes = [
  {
    id: "balanced",
    label: "Best Choice",
    helper: "Weighted by score, price, fit, demand, and rating",
  },
  {
    id: "closest",
    label: "Closest",
    helper: "Fastest access from your current location",
  },
  {
    id: "cheapest",
    label: "Cheapest",
    helper: "Lowest live price in your range",
  },
  {
    id: "calm",
    label: "Least Crowded",
    helper: "Highest availability and lower crowd pressure",
  },
  {
    id: "fastestExit",
    label: "Fastest Exit",
    helper: "Prioritizes smoother exit flow and lower friction",
  },
];

function getAvailabilityTone(parking) {
  if ((parking?.availableSlots || 0) <= 0) {
    return "text-rose-100";
  }

  if (parking?.totalSlots && parking.availableSlots / parking.totalSlots <= 0.3) {
    return "text-amber-100";
  }

  return "text-emerald-100";
}

function UserDashboard() {
  const { session, user, logout, refreshProfile, toggleFavorite } = useAuth();
  const [location, setLocation] = useState({
    lat: 13.0827,
    lng: 80.2707,
    fullText: "Chennai",
  });
  const [carType, setCarType] = useState("sedan");
  const [maxPrice, setMaxPrice] = useState(500);
  const [maxDistance, setMaxDistance] = useState(10);
  const [parkings, setParkings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [bookingId, setBookingId] = useState("");
  const [recommendationMode, setRecommendationMode] = useState("balanced");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedParking, setSelectedParking] = useState(null);
  const [checkoutState, setCheckoutState] = useState("idle");
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
      },
      () => {}
    );
  }, []);

  const preferredAreas = useMemo(() => {
    const counts = bookings.reduce((accumulator, booking) => {
      const area = booking.parkingId?.address?.area || "";
      if (!area) {
        return accumulator;
      }

      accumulator[area] = (accumulator[area] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([area]) => area);
  }, [bookings]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        carType,
        maxPrice: String(maxPrice),
        maxDistance: String(maxDistance),
      });

      if (preferredAreas.length) {
        params.set("preferredAreas", preferredAreas.join(","));
      }

      const [parkingRes, bookingRes, hotspotRes] = await Promise.all([
        API.get(`/parking/search?${params.toString()}`),
        API.get("/booking/mine"),
        API.get("/booking/hotspots"),
      ]);

      setParkings(parkingRes.data);
      setBookings(bookingRes.data);
      setHotspots(hotspotRes.data);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Could not load live user intelligence");
    } finally {
      setLoading(false);
    }
  }, [carType, location.lat, location.lng, maxDistance, maxPrice, preferredAreas]);

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
      void refreshProfile();
    };

    socket.on("parking:changed", handleRealtimeRefresh);
    socket.on("booking:changed", handleRealtimeRefresh);

    return () => {
      socket.off("parking:changed", handleRealtimeRefresh);
      socket.off("booking:changed", handleRealtimeRefresh);
    };
  }, [loadDashboard, refreshProfile, session?.token]);

  const favoriteIds = user.favoriteParkings || [];

  const sortedRecommendations = useMemo(() => {
    const ranked = [...parkings];

    if (recommendationMode === "closest") {
      return ranked.sort(
        (left, right) =>
          (left.ai?.distanceKm ?? Number.MAX_SAFE_INTEGER) -
          (right.ai?.distanceKm ?? Number.MAX_SAFE_INTEGER)
      );
    }

    if (recommendationMode === "cheapest") {
      return ranked.sort(
        (left, right) =>
          Number(left.dynamicPrice || left.fare) - Number(right.dynamicPrice || right.fare)
      );
    }

    if (recommendationMode === "calm") {
      return ranked.sort((left, right) => {
        const leftDemand = left.ai?.demandLevel === "Low" ? 2 : left.ai?.demandLevel === "Medium" ? 1 : 0;
        const rightDemand = right.ai?.demandLevel === "Low" ? 2 : right.ai?.demandLevel === "Medium" ? 1 : 0;
        const availabilityDelta = (right.availableSlots || 0) - (left.availableSlots || 0);
        return rightDemand - leftDemand || availabilityDelta;
      });
    }

    if (recommendationMode === "fastestExit") {
      return ranked.sort(
        (left, right) =>
          (right.ai?.fastestExitScore || 0) - (left.ai?.fastestExitScore || 0)
      );
    }

    return ranked.sort(
      (left, right) =>
        (right.ai?.recommendationScore || 0) - (left.ai?.recommendationScore || 0)
    );
  }, [parkings, recommendationMode]);

  const recommendations = useMemo(
    () => sortedRecommendations.slice(0, 4),
    [sortedRecommendations]
  );

  const discoveryRail = useMemo(
    () => sortedRecommendations.slice(0, 3),
    [sortedRecommendations]
  );

  const recommendationLead = recommendations[0] || null;

  const personalizedRecommendations = useMemo(
    () => parkings.filter((parking) => parking.ai?.personalized).slice(0, 2),
    [parkings]
  );

  const bookingSpend = useMemo(
    () => bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0),
    [bookings]
  );

  const averageRecommendationPrice = useMemo(() => {
    if (!parkings.length) {
      return 0;
    }

    return Math.round(
      parkings.reduce((sum, parking) => sum + Number(parking.dynamicPrice || parking.fare || 0), 0) /
        parkings.length
    );
  }, [parkings]);

  const latestConfirmedBooking = useMemo(
    () => bookings.find((booking) => booking.status === "confirmed"),
    [bookings]
  );

  const smartAlerts = useMemo(() => {
    const alerts = [];
    const bestRecommendation = recommendations[0];
    const highDemandParking = parkings.find(
      (parking) => parking.ai?.demandLevel === "High" || parking.availableSlots <= 2
    );
    const fallbackParking = sortedRecommendations.find((parking) => parking.availableSlots > 2);

    if (bestRecommendation?.availableSlots <= 2) {
      alerts.push(`Only ${bestRecommendation.availableSlots} slots left at ${bestRecommendation.title}.`);
    }

    if (highDemandParking) {
      alerts.push(
        `${highDemandParking.title} is showing a demand spike. Dynamic pricing and fallback suggestions are active.`
      );
    }

    if (latestConfirmedBooking) {
      alerts.push(
        `Your latest booking at ${latestConfirmedBooking.parkingTitle}${latestConfirmedBooking.assignedSlotCode ? ` is on slot ${latestConfirmedBooking.assignedSlotCode}` : ""}.`
      );
    }

    if (fallbackParking && highDemandParking) {
      alerts.push(
        `Try nearby parking: ${fallbackParking.title} has ${fallbackParking.availableSlots} slots and a ${fallbackParking.ai?.recommendationScore || 0}/100 Smart Score.`
      );
    }

    if (!alerts.length) {
      alerts.push("Demand is balanced right now. This is a strong time to book without surge pressure.");
    }

    return alerts.slice(0, 3);
  }, [latestConfirmedBooking, parkings, recommendations, sortedRecommendations]);

  const behaviorSummary = useMemo(() => {
    if (preferredAreas.length) {
      return `Recommended for you is currently tuned around ${preferredAreas.join(", ")}.`;
    }

    if (bookings.length >= 4) {
      return "Your recommendation model is tuned using recent booking behavior and live network demand.";
    }

    return "Explore more zones to unlock stronger personalization and sharper parking suggestions.";
  }, [bookings.length, preferredAreas]);

  const resetCheckout = useCallback(() => {
    setSelectedParking(null);
    setCheckoutState("idle");
    setCheckoutError("");
    setBookingId("");
  }, []);

  const handleBook = (parking) => {
    setSelectedParking(parking);
    setCheckoutState("idle");
    setCheckoutError("");
    setMessage("");
  };

  const handleCloseCheckout = () => {
    if (checkoutState === "processing") {
      return;
    }

    resetCheckout();
  };

  const handleConfirmCheckout = async () => {
    if (!selectedParking) {
      return;
    }

    try {
      setBookingId(selectedParking._id);
      setCheckoutState("processing");
      setCheckoutError("");
      await new Promise((resolve) => {
        window.setTimeout(resolve, 2000);
      });

      const response = await API.post("/booking/create", {
        parkingId: selectedParking._id,
      });

      await Promise.all([loadDashboard(), refreshProfile()]);
      setCheckoutState("success");
      setMessage(response.data?.msg || "Payment successful and booking confirmed");
      window.setTimeout(() => {
        resetCheckout();
      }, 1400);
    } catch (err) {
      const nextMessage = err.response?.data?.msg || "Booking could not be completed";
      setCheckoutState("idle");
      setCheckoutError(nextMessage);
      setMessage(nextMessage);
      setBookingId("");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_20%),#020617] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">User Command Center</p>
            <h1 className="mt-2 text-4xl font-semibold">Welcome back, {user.name}</h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              AI-assisted parking search, live map intelligence, simulated checkout, and smart city demand signals.
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

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Live Recommendations" value={parkings.length} helper="Scored by SmartPark AI" />
          <MetricCard label="Favorites" value={favoriteIds.length} accent="blue" helper="Saved from your discovery flow" />
          <MetricCard label="Bookings" value={bookings.length} accent="emerald" helper="Personal activity timeline" />
          <MetricCard label="Spend" value={`Rs. ${bookingSpend}`} accent="blue" helper="Cumulative booking value" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {smartAlerts.map((alert) => (
            <div
              key={alert}
              className="rounded-[28px] border border-emerald-400/15 bg-emerald-400/10 p-4 backdrop-blur-2xl"
            >
              <div className="flex items-start gap-3">
                <BellRing className="mt-0.5 text-emerald-200" size={18} />
                <p className="text-sm text-emerald-50">{alert}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Discovery Layer</p>
                  <h2 className="mt-2 text-2xl font-semibold">Search by map, vehicle, price, and distance</h2>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                  <MapPinned className="mr-2 inline-block" size={14} />
                  {location.fullText || "Live geolocation"}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <select
                  value={carType}
                  onChange={(event) => setCarType(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm"
                >
                  <option value="hatchback">Hatchback</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                </select>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/40">Max Price</label>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(Number(event.target.value))}
                    className="mt-3 w-full"
                  />
                  <p className="mt-2 text-sm text-white/70">Rs. {maxPrice}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/40">Distance</label>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={maxDistance}
                    onChange={(event) => setMaxDistance(Number(event.target.value))}
                    className="mt-3 w-full"
                  />
                  <p className="mt-2 text-sm text-white/70">{maxDistance} km</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/40">AI Search State</label>
                  <p className="mt-3 text-sm text-white/70">
                    {loading
                      ? "Generating live recommendations..."
                      : "Availability syncs with realtime updates and fallback polling"}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <MapPanel
                  markers={parkings}
                  interactive
                  selectedLocation={location}
                  onLocationChange={setLocation}
                  height="520px"
                  showHeatmap
                  showLegend
                />
              </div>

              <Motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="-mt-16 rounded-[30px] border border-white/10 bg-slate-950/92 p-5 shadow-[0_20px_80px_rgba(2,8,23,0.55)] backdrop-blur-2xl"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Layers3 className="text-emerald-200" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Bottom Discovery Panel</p>
                      <h3 className="mt-1 text-xl font-semibold">Swipe through the strongest nearby options</h3>
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65">
                    {discoveryRail.length} live matches in focus
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {discoveryRail.map((parking) => (
                    <button
                      key={parking._id}
                      type="button"
                      onClick={() => handleBook(parking)}
                      className="rounded-[26px] border border-white/10 bg-white/5 p-4 text-left transition hover:border-emerald-300/30 hover:bg-white/[0.08]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-white">{parking.title}</p>
                          <p className="mt-2 text-sm text-white/55">
                            {parking.address?.area}, {parking.address?.district}
                          </p>
                        </div>
                        <span className={`text-sm font-medium ${getAvailabilityTone(parking)}`}>
                          {parking.availableSlots}/{parking.totalSlots}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/70">
                        <div className="rounded-2xl bg-slate-950/70 p-3">
                          <p className="text-white/40">Price</p>
                          <p className="mt-2 text-white">Rs. {parking.dynamicPrice || parking.fare}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-950/70 p-3">
                          <p className="text-white/40">Smart Score</p>
                          <p className="mt-2 text-white">{parking.ai?.recommendationScore || 0}/100</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Motion.div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-emerald-200" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Decision Layer</p>
                    <h2 className="mt-1 text-2xl font-semibold">Parking choices ranked by SmartPark AI</h2>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white/70">
                  Avg live price Rs. {averageRecommendationPrice}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {recommendationModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setRecommendationMode(mode.id)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      recommendationMode === mode.id
                        ? "border-emerald-300/30 bg-emerald-300 text-slate-950"
                        : "border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-sm text-white/55">
                {recommendationModes.find((mode) => mode.id === recommendationMode)?.helper}
              </p>

              {recommendationLead ? (
                <div className="mt-5 rounded-[28px] border border-emerald-400/15 bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(15,23,42,0.86))] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Flame className="text-emerald-200" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Top AI Recommended Parking</p>
                        <h3 className="mt-1 text-2xl font-semibold text-white">{recommendationLead.title}</h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBook(recommendationLead)}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                    >
                      Pay & Book
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-950/70 p-4">
                      <p className="text-sm text-white/40">Smart Score</p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {recommendationLead.ai?.recommendationScore || 0}/100
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/70 p-4">
                      <p className="text-sm text-white/40">Distance</p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {recommendationLead.ai?.distanceKm ?? "Nearby"} km
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/70 p-4">
                      <p className="text-sm text-white/40">Price</p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        Rs. {recommendationLead.dynamicPrice || recommendationLead.fare}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/70 p-4">
                      <p className="text-sm text-white/40">Availability</p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {recommendationLead.availableSlots}/{recommendationLead.totalSlots}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-white/75">
                    {recommendationLead.ai?.explanation || "Live recommendation available."}
                  </p>
                </div>
              ) : null}

              {message ? (
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  {message}
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {recommendations.map((parking) => (
                  <ParkingCard
                    key={parking._id}
                    parking={parking}
                    bookingId={bookingId}
                    isFavorite={favoriteIds.includes(parking._id)}
                    onFavorite={() => toggleFavorite(parking._id)}
                    onBook={() => handleBook(parking)}
                  />
                ))}
              </div>

              {!recommendations.length ? (
                <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-6 text-sm text-white/60">
                  No live parking matches were found for this filter. SmartPark AI will suggest fallback options when new inventory appears.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <Route className="text-emerald-200" />
                <div>
                  <h3 className="text-xl font-semibold">Personalization Layer</h3>
                  <p className="text-sm text-white/55">{behaviorSummary}</p>
                </div>
              </div>
            </div>

            {personalizedRecommendations.length ? (
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <Gauge className="text-emerald-200" />
                  <div>
                    <h3 className="text-xl font-semibold">Recommended For You</h3>
                    <p className="text-sm text-white/55">Based on your preferred locations and booking history</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {personalizedRecommendations.map((parking) => (
                    <div key={parking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <p className="font-medium text-white">{parking.title}</p>
                      <p className="mt-2 text-sm text-white/60">
                        {parking.address?.area} | Smart Score {parking.ai?.recommendationScore || 0}/100
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <AIChatAssistant location={location} carType={carType} maxPrice={maxPrice} />

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
              <h3 className="text-xl font-semibold text-white">Booking History</h3>
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
                    Your booking timeline will appear here after the first reservation.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <Bot className="text-emerald-200" />
                <div>
                  <h3 className="text-xl font-semibold">Trending Hotspots</h3>
                  <p className="text-sm text-white/55">Live activity from the booking network</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {hotspots.map((hotspot) => (
                  <div key={hotspot._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="font-medium text-white">{hotspot.parkingTitle}</p>
                    <p className="mt-2 text-sm text-white/60">
                      {hotspot.totalBookings} bookings | Avg fare Rs. {Math.round(hotspot.avgFare)}
                    </p>
                  </div>
                ))}
                {!hotspots.length ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-white/55">
                    Hotspot intelligence will appear as soon as booking data accumulates.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={Boolean(selectedParking)}
        parking={selectedParking}
        userEmail={user.email}
        status={checkoutState}
        error={checkoutError}
        onClose={handleCloseCheckout}
        onConfirm={handleConfirmCheckout}
      />
    </div>
  );
}

export default UserDashboard;
