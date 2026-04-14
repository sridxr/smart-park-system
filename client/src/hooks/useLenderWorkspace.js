import { useCallback, useEffect, useMemo, useState } from "react";

import API from "../api";
import { getRealtimeSocket } from "../lib/realtime";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/ToastProvider";
import analyticsService from "../services/analyticsService";
import mobilityService from "../services/mobilityService";
import platformService from "../services/platformService";

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
    pricePerHour: 120,
    totalSlots: 20,
    availableSlots: 20,
    parkingSize: "medium",
    availabilityHours: {
      openTime: "06:00",
      closeTime: "23:00",
    },
    allowedCars: ["sedan"],
    supportedVehicleTypes: ["car"],
    supportedBrands: [],
    supportedModels: [],
    supportedVehicleSizes: ["medium"],
    amenities: ["CCTV", "Covered"],
  };
}

export function useLenderWorkspace() {
  const { session } = useAuth();
  const { showToast } = useToast();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoDynamicPricing, setAutoDynamicPricing] = useState(true);
  const [selectedListingId, setSelectedListingId] = useState("");
  const [editingListingId, setEditingListingId] = useState("");
  const [iotOverview, setIotOverview] = useState([]);
  const [bookingDateFilter, setBookingDateFilter] = useState(() => new Date().toISOString().slice(0, 10));
  const [platformStatus, setPlatformStatus] = useState({
    systemOnline: true,
    lastUpdatedAt: new Date().toISOString(),
    aiEngineActive: true,
    lastDecisionAt: new Date().toISOString(),
    unreadCount: 0,
  });
  const [mobilityForecast, setMobilityForecast] = useState({
    message: "",
    demandLevel: "Low",
    demandScore: 0,
  });
  const [tripPerformance, setTripPerformance] = useState({
    occupancyRate: 0,
    revenue: 0,
    peakHours: [],
    averageRating: 0,
    completedTrips: 0,
  });

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const [listingRes, summaryRes, insightRes, iotRes, datedBookingsRes, platformStatusRes, mobilityForecastRes, tripPerformanceRes] = await Promise.all([
        API.get("/parking/mine"),
        API.get("/booking/summary/lender"),
        API.get("/ai/insights/lender"),
        analyticsService.getIoTSummary(),
        API.get("/booking/by-date", {
          params: { date: bookingDateFilter },
        }),
        platformService.getPlatformStatus(),
        mobilityService.getLenderMobilityForecast().catch(() => ({ data: null })),
        mobilityService.getLenderTripPerformance().catch(() => ({ data: null })),
      ]);
      const iotMap = new Map((iotRes.data || []).map((item) => [item._id, item]));
      setListings(
        (listingRes.data || []).map((listing) => ({
          ...listing,
          sensorStatus: iotMap.get(listing._id)?.sensorStatus || listing.sensorStatus,
          slotLayout: iotMap.get(listing._id)?.slotLayout || listing.slotLayout,
        }))
      );
      setSummary(summaryRes.data);
      setInsights([
        ...(summaryRes.data.insights || []),
        ...((insightRes.data.insights || []).filter(
          (insight) => !(summaryRes.data.insights || []).includes(insight)
        )),
      ]);
      setBookings(datedBookingsRes.data || []);
      setIotOverview(iotRes.data || []);
      setPlatformStatus(platformStatusRes.data || {});
      setMobilityForecast(mobilityForecastRes.data || { message: "", demandLevel: "Low", demandScore: 0 });
      setTripPerformance(tripPerformanceRes.data || { occupancyRate: 0, revenue: 0, peakHours: [], averageRating: 0, completedTrips: 0 });
    } finally {
      setLoading(false);
    }
  }, [bookingDateFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadWorkspace(), 0);
    const intervalId = window.setInterval(() => void loadWorkspace(), 60000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadWorkspace]);

  useEffect(() => {
    if (!selectedListingId && listings[0]?._id) {
      setSelectedListingId(listings[0]._id);
    }
  }, [listings, selectedListingId]);

  useEffect(() => {
    const socket = getRealtimeSocket(session?.token);
    if (!socket) {
      return undefined;
    }
    const handleRefresh = () => {
      void loadWorkspace();
    };
    socket.on("parking:changed", handleRefresh);
    socket.on("booking:changed", handleRefresh);
    return () => {
      socket.off("parking:changed", handleRefresh);
      socket.off("booking:changed", handleRefresh);
    };
  }, [loadWorkspace, session?.token]);

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
  const selectedListing =
    listings.find((listing) => listing._id === selectedListingId) || listings[0] || null;

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

  const pricingOpportunities = useMemo(
    () =>
      listings
        .map((listing) => ({
          ...listing,
          delta: Number(listing.dynamicPrice || 0) - Number(listing.fare || 0),
        }))
        .sort((left, right) => right.delta - left.delta)
        .slice(0, 4),
    [listings]
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
      location: { lat: location.lat, lng: location.lng },
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

  const loadListingIntoEditor = useCallback(
    (listing = selectedListing) => {
      if (!listing) {
        return;
      }
      setEditingListingId(listing._id);
      setForm({
        title: listing.title || "",
        description: listing.description || "",
        address: {
          fullText: listing.address?.fullText || "",
          area: listing.address?.area || "",
          district: listing.address?.district || "",
          state: listing.address?.state || "",
          city: listing.address?.city || "",
          country: listing.address?.country || "India",
        },
        location: {
          lat: listing.location?.lat || 13.0827,
          lng: listing.location?.lng || 80.2707,
        },
        fare: Number(listing.fare || 120),
        pricePerHour: Number(listing.pricePerHour || listing.fare || 120),
        totalSlots: Number(listing.totalSlots || 20),
        availableSlots: Number(listing.availableSlots || 20),
        parkingSize: listing.parkingSize || "medium",
        availabilityHours: {
          openTime: listing.availabilityHours?.openTime || "06:00",
          closeTime: listing.availabilityHours?.closeTime || "23:00",
        },
        allowedCars: listing.allowedCars || ["sedan"],
        supportedVehicleTypes: listing.supportedVehicleTypes || ["car"],
        supportedBrands: listing.supportedBrands || [],
        supportedModels: listing.supportedModels || [],
        supportedVehicleSizes: listing.supportedVehicleSizes || ["medium"],
        amenities: listing.amenities || ["CCTV", "Covered"],
      });
      setAutoDynamicPricing(Number(listing.dynamicPrice || listing.fare) !== Number(listing.fare));
    },
    [selectedListing]
  );

  const saveListing = async () => {
    try {
      if (!form.supportedVehicleTypes?.length) {
        showToast({
          tone: "warning",
          title: "Vehicle support required",
          description: "Select at least one supported vehicle type before saving the parking.",
        });
        return;
      }

      setSaving(true);
      const payload = {
        ...form,
        dynamicPrice: previewDynamicPrice,
      };
      const response = await (editingListingId
        ? API.patch(`/parking/${editingListingId}`, payload)
        : API.post("/parking/add", payload));
      await loadWorkspace();
      setSelectedListingId(response.data?._id || selectedListingId);
      showToast({
        tone: "success",
        title: editingListingId ? "Parking updated" : "Parking created",
        description: "Your inventory has been refreshed.",
      });
      resetEditor();
    } catch (err) {
      showToast({
        tone: "error",
        title: "Parking save failed",
        description: err.response?.data?.msg || "The listing could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    setForm,
    listings,
    bookings,
    summary,
    insights,
    iotOverview,
    bookingDateFilter,
    setBookingDateFilter,
    loading,
    saving,
    autoDynamicPricing,
    setAutoDynamicPricing,
    selectedListingId,
    setSelectedListingId,
    editingListingId,
    selectedListing,
    occupancyRate,
    activeSlots,
    weeklyRevenue,
    todayRevenue,
    pricingOpportunities,
    previewDynamicPrice,
    platformStatus,
    mobilityForecast,
    tripPerformance,
    loadWorkspace,
    handleChange,
    handleNestedChange,
    handleLocationChange,
    toggleArrayValue,
    saveListing,
    resetEditor,
    loadListingIntoEditor,
  };
}
