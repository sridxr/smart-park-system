import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import API from "../api";
import { useAuth } from "../context/AuthContext";
import { getRealtimeSocket } from "../lib/realtime";
import { useToast } from "../components/ui/ToastProvider";
import platformService from "../services/platformService";
import mobilityService from "../services/mobilityService";
import eliteAIService from "../services/eliteAIService";

export const recommendationModes = [
  { id: "balanced", label: "Best Choice", helper: "Weighted by score, price, fit, demand, and rating" },
  { id: "closest", label: "Closest", helper: "Fastest access from your current location" },
  { id: "cheapest", label: "Cheapest", helper: "Lowest live price in your range" },
  { id: "calm", label: "Least Crowded", helper: "Highest availability and lower crowd pressure" },
  { id: "fastestExit", label: "Fastest Exit", helper: "Prioritizes smoother exit flow and lower friction" },
];

export const strategyModes = [
  { id: "balanced", label: "Smart Balance", helper: "Blends price, speed, traffic, and availability" },
  { id: "cheapest", label: "Cheapest", helper: "Pushes the engine toward lower price outcomes" },
  { id: "fastest", label: "Fastest", helper: "Prioritizes lower ETA and less route friction" },
];

function normalizeParkingRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.filter((row) => row && typeof row === "object");
}

function normalizeList(rows) {
  return Array.isArray(rows) ? rows : [];
}

function getRoundedStartTime() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now;
}

function buildBookingWindow(now = getRoundedStartTime()) {
  const date = now.toISOString().slice(0, 10);
  const startTimeValue = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const end = new Date(now.getTime() + 60 * 60 * 1000);

  return {
    date,
    startTimeValue,
    duration: 1,
    startTime: now.toISOString(),
    endTime: end.toISOString(),
  };
}

function hydrateBookingWindow(payload = {}) {
  const baseDate = payload.date ? new Date(payload.date) : getRoundedStartTime();
  const [hours, minutes] = String(payload.startClockTime || payload.startTimeValue || "09:00")
    .split(":")
    .map((value) => Number.parseInt(value, 10));
  baseDate.setHours(Number.isNaN(hours) ? 9 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
  const duration = Number(payload.duration || 1);
  const end = new Date(baseDate.getTime() + duration * 60 * 60 * 1000);

  return {
    date: baseDate.toISOString().slice(0, 10),
    startTimeValue: `${String(baseDate.getHours()).padStart(2, "0")}:${String(baseDate.getMinutes()).padStart(2, "0")}`,
    duration,
    startTime: baseDate.toISOString(),
    endTime: end.toISOString(),
  };
}

function getBookingAmountFallback(parking, duration = 1) {
  return Math.max(0, Math.round(Number(parking?.pricePerHour || parking?.fare || 0) * Number(duration || 1)));
}

function buildVehicleQueryParams(vehicle) {
  if (!vehicle) {
    return {};
  }

  return {
    vehicleType: vehicle.type || vehicle.vehicleType || "",
    brand: vehicle.brand || "",
    model: vehicle.model || "",
    vehicleSize: vehicle.vehicleSize || "",
  };
}

function toParkingId(candidate) {
  if (!candidate) {
    return "";
  }

  if (typeof candidate === "string") {
    return candidate;
  }

  return candidate._id || candidate.parkingId || candidate.id || "";
}

function buildComparisonStack(recommendations = []) {
  if (!recommendations.length) {
    return [];
  }

  const bestChoice = recommendations[0];
  const cheapest = [...recommendations].sort(
    (left, right) => Number(left.dynamicPrice || left.fare || 0) - Number(right.dynamicPrice || right.fare || 0)
  )[0];
  const fastest = [...recommendations].sort(
    (left, right) => Number(left.ai?.traffic?.etaMinutes || 999) - Number(right.ai?.traffic?.etaMinutes || 999)
  )[0];
  const closest = [...recommendations].sort(
    (left, right) => Number(left.ai?.distanceKm || 999) - Number(right.ai?.distanceKm || 999)
  )[0];

  return [
    { label: "Best Choice", icon: "rocket", parking: bestChoice },
    { label: "Cheapest", icon: "wallet", parking: cheapest },
    { label: "Fastest", icon: "zap", parking: fastest },
    { label: "Closest", icon: "map-pin", parking: closest },
  ]
    .filter((item) => item.parking)
    .map((item) => ({
      ...item,
      parkingId: item.parking._id,
      title: item.parking.title,
      price: Number(item.parking.dynamicPrice || item.parking.fare || 0),
      etaMinutes: Number(item.parking.ai?.traffic?.etaMinutes || 0),
      distanceKm: Number(item.parking.ai?.distanceKm || 0),
    }));
}

export function useUserWorkspace() {
  const { session, user, refreshProfile, toggleFavorite } = useAuth();
  const { showToast } = useToast();
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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [recommendationMode, setRecommendationMode] = useState("balanced");
  const [strategyMode, setStrategyMode] = useState("balanced");
  const [selectedParking, setSelectedParking] = useState(null);
  const [checkoutState, setCheckoutState] = useState("idle");
  const [bookingId, setBookingId] = useState("");
  const [bookingWindow, setBookingWindow] = useState(() => buildBookingWindow());
  const [availabilityPreview, setAvailabilityPreview] = useState({
    availableSlots: null,
    assignedSlotCode: "",
    hourlyRate: 0,
    totalPrice: 0,
    recommendedTime: "",
  });
  const [reservationExpiresAt, setReservationExpiresAt] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState("");
  const [personalization, setPersonalization] = useState({
    preferredLocations: [],
    preferredPriceRange: { min: 0, max: 0 },
    bookingTimePatterns: [],
    recommendations: [],
    summary: "",
  });
  const [behaviorSummary, setBehaviorSummary] = useState({
    preferredLocations: [],
    preferredPriceRange: { min: 0, max: 0 },
    bookingHourHistogram: [],
    searches: [],
    bookings: [],
  });
  const [timeline, setTimeline] = useState([]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [platformStatus, setPlatformStatus] = useState({
    systemOnline: true,
    lastUpdatedAt: new Date().toISOString(),
    aiEngineActive: true,
    lastDecisionAt: new Date().toISOString(),
    unreadCount: 0,
    personalizationActive: false,
  });
  const [trafficRecommendation, setTrafficRecommendation] = useState({
    bestParking: null,
    eta: "",
    trafficDelay: "+0 min",
    routeQuality: "Unknown",
    explanation: "",
    trafficEnabled: false,
    refreshedAt: "",
  });
  const [vehicles, setVehicles] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripHistory, setTripHistory] = useState([]);
  const [currentBilling, setCurrentBilling] = useState({
    active: false,
    durationMinutes: 0,
    durationHours: 0,
    totalPrice: 0,
  });
  const [mobilityInsights, setMobilityInsights] = useState({
    contextMode: "balanced",
    selectedVehicle: null,
    savedLocations: [],
    activeTrip: null,
    oneTapRecommendation: null,
    demandForecast: null,
    reminders: [],
    trustScore: 0,
    trafficSummary: null,
  });
  const [decisionProfile, setDecisionProfile] = useState({
    prefersCheap: false,
    prefersFast: false,
    preferredAreas: [],
    avgBookingTime: 0,
    walkingTolerance: "balanced",
    avoidsTraffic: false,
    confidence: 0,
    decisionStyle: [],
    summary: "",
  });
  const [decisionSimulation, setDecisionSimulation] = useState({
    loading: false,
    scenarioLabel: "",
    baseline: null,
    scenario: null,
    summary: [],
    explanation: "",
    areaIntelligence: null,
    timeValueOptimizer: "",
  });
  const [simulationOffset, setSimulationOffset] = useState(30);
  const [decisionReplay, setDecisionReplay] = useState({
    loading: false,
    confidence: 0,
    confidenceMessage: "",
    replaySteps: [],
    comparisonStack: [],
    areaIntelligence: null,
    stress: { score: 0, level: "Low" },
    timeValueOptimizer: "",
    explanation: "",
  });
  const [decisionReplayTargetId, setDecisionReplayTargetId] = useState("");
  const [liveDecisionSwitch, setLiveDecisionSwitch] = useState({
    shouldSwitch: false,
    message: "",
    explanation: "",
    currentOption: null,
    betterOption: null,
    savedMinutes: 0,
    savedAmount: 0,
  });
  const [intentPrediction, setIntentPrediction] = useState({
    detected: false,
    confidence: 0,
    timeContext: null,
    predictedDestination: null,
    message: "",
    reasoning: [],
    behavioralModel: "",
  });
  const [zeroClickSuggestion, setZeroClickSuggestion] = useState({
    available: false,
    confidence: 0,
    predictedDestination: null,
    parking: null,
    statusMessage: "",
    explanation: "",
    requiresConfirmation: true,
    confirmLabel: "Confirm parking",
    cancelLabel: "Not now",
  });
  const [zeroClickDismissed, setZeroClickDismissed] = useState(false);
  const [futureSimulation, setFutureSimulation] = useState({
    scenarioLabel: "",
    uncertainty: null,
    selfOptimizingFeedback: "",
    decisionConflict: "",
    comparisonStack: [],
  });
  const [collectiveInsight, setCollectiveInsight] = useState({
    summary: "",
    insight: "",
    movementTrends: [],
  });
  const [decisionTree, setDecisionTree] = useState({
    branches: [],
    conflictResolution: "",
    behavioralModel: "",
  });
  const lastTrackedSearch = useRef("");

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

  const activePreferredAreas = useMemo(() => {
    const behaviorAreas = behaviorSummary.preferredLocations || [];
    return behaviorAreas.length ? behaviorAreas : preferredAreas;
  }, [behaviorSummary.preferredLocations, preferredAreas]);
  const activePreferredAreasKey = useMemo(
    () => activePreferredAreas.join("|"),
    [activePreferredAreas]
  );
  const selectedVehicle = useMemo(
    () =>
      vehicles.find((vehicle) => vehicle._id === selectedVehicleId) ||
      vehicles.find((vehicle) => vehicle.isDefault) ||
      null,
    [selectedVehicleId, vehicles]
  );
  const selectedVehicleQuery = useMemo(
    () => buildVehicleQueryParams(selectedVehicle),
    [selectedVehicle]
  );

  const sortedRecommendationsPreview = useMemo(() => {
    const ranked = [...parkings];
    const activeMode = strategyMode === "fastest" ? "fastest" : recommendationMode;

    if (activeMode === "closest") {
      return ranked.sort(
        (left, right) =>
          (left.ai?.distanceKm ?? Number.MAX_SAFE_INTEGER) -
          (right.ai?.distanceKm ?? Number.MAX_SAFE_INTEGER)
      );
    }

    if (activeMode === "cheapest") {
      return ranked.sort(
        (left, right) =>
          Number(left.dynamicPrice || left.fare) - Number(right.dynamicPrice || right.fare)
      );
    }

    if (activeMode === "calm") {
      return ranked.sort((left, right) => {
        const leftDemand = left.ai?.demandLevel === "Low" ? 2 : left.ai?.demandLevel === "Medium" ? 1 : 0;
        const rightDemand = right.ai?.demandLevel === "Low" ? 2 : right.ai?.demandLevel === "Medium" ? 1 : 0;
        return rightDemand - leftDemand || (right.availableSlots || 0) - (left.availableSlots || 0);
      });
    }

    if (activeMode === "fastestExit") {
      return ranked.sort(
        (left, right) => (right.ai?.fastestExitScore || 0) - (left.ai?.fastestExitScore || 0)
      );
    }

    if (activeMode === "fastest") {
      return ranked.sort(
        (left, right) =>
          Number(left.ai?.traffic?.etaMinutes || Number.MAX_SAFE_INTEGER) -
          Number(right.ai?.traffic?.etaMinutes || Number.MAX_SAFE_INTEGER)
      );
    }

    return ranked.sort(
      (left, right) => (right.ai?.recommendationScore || 0) - (left.ai?.recommendationScore || 0)
    );
  }, [parkings, recommendationMode, strategyMode]);

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        carType,
        maxPrice: String(maxPrice),
        maxDistance: String(maxDistance),
      });

      if (activePreferredAreasKey) {
        params.set("preferredAreas", activePreferredAreasKey.split("|").join(","));
      }

      Object.entries(selectedVehicleQuery).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });

      const [parkingRes, bookingRes, hotspotRes, personalizationRes, behaviorRes, timelineRes, platformStatusRes, trafficRes, tripStateRes, billingRes, vehiclesRes, savedLocationsRes, mobilityInsightsRes, decisionProfileRes, liveSwitchRes] = await Promise.all([
        API.get(`/parking/search?${params.toString()}`),
        API.get("/booking/mine"),
        API.get("/booking/hotspots"),
        platformService.getPersonalization({
          lat: location.lat,
          lng: location.lng,
          carType,
          maxPrice,
          ...selectedVehicleQuery,
        }),
        platformService.getBehaviorSummary(),
        platformService.getTimeline(),
        platformService.getPlatformStatus(),
        platformService
          .getTrafficRecommendations({
            lat: location.lat,
            lng: location.lng,
            carType,
            maxPrice,
            maxDistance,
            preferredAreas: activePreferredAreasKey.split("|").filter(Boolean).join(","),
            ...selectedVehicleQuery,
          })
          .catch(() => ({ data: null })),
        mobilityService.getTripState().catch(() => ({ data: { activeTrip: null, tripHistory: [] } })),
        mobilityService.getCurrentBilling().catch(() => ({ data: { active: false, totalPrice: 0, durationMinutes: 0 } })),
        mobilityService.listVehicles().catch(() => ({ data: [] })),
        mobilityService.listSavedLocations().catch(() => ({ data: [] })),
        mobilityService
          .getMobilityInsights({
            lat: location.lat,
            lng: location.lng,
            maxPrice,
            vehicleId: selectedVehicleId || undefined,
          })
          .catch(() => ({ data: null })),
        eliteAIService.getDecisionProfile().catch(() => ({ data: null })),
        eliteAIService
          .getLiveSwitch({
            lat: location.lat,
            lng: location.lng,
            carType,
            maxPrice,
            maxDistance,
            mode: strategyMode,
          })
          .catch(() => ({ data: null })),
      ]);

      const trafficPayload = trafficRes?.data || null;
      const nextParkings =
        trafficPayload?.recommendations?.length
          ? trafficPayload.recommendations
          : parkingRes.data;

      setParkings(normalizeParkingRows(nextParkings));
      setBookings(normalizeList(bookingRes.data));
      setHotspots(normalizeList(hotspotRes.data));
      setPersonalization({
        preferredLocations: personalizationRes.data?.preferredLocations || [],
        preferredPriceRange: personalizationRes.data?.preferredPriceRange || { min: 0, max: 0 },
        bookingTimePatterns: personalizationRes.data?.bookingTimePatterns || [],
        recommendations: normalizeParkingRows(personalizationRes.data?.recommendations),
        summary: personalizationRes.data?.summary || "",
      });
      setBehaviorSummary({
        preferredLocations: behaviorRes.data?.preferredLocations || [],
        preferredPriceRange: behaviorRes.data?.preferredPriceRange || { min: 0, max: 0 },
        bookingHourHistogram: behaviorRes.data?.bookingHourHistogram || [],
        searches: normalizeList(behaviorRes.data?.searches),
        bookings: normalizeList(behaviorRes.data?.bookings),
      });
      setTimeline(normalizeList(timelineRes.data));
      setPlatformStatus(platformStatusRes.data || {});
      setActiveTrip(tripStateRes.data?.activeTrip || null);
      setTripHistory(normalizeList(tripStateRes.data?.tripHistory));
      setCurrentBilling(billingRes.data || { active: false, totalPrice: 0, durationMinutes: 0 });
      setVehicles(normalizeList(vehiclesRes.data));
      setSavedLocations(normalizeList(savedLocationsRes.data));
      setMobilityInsights(
        mobilityInsightsRes.data || {
          contextMode: "balanced",
          selectedVehicle: null,
          savedLocations: [],
          activeTrip: null,
          oneTapRecommendation: null,
          demandForecast: null,
          reminders: [],
          trustScore: 0,
          trafficSummary: null,
        }
      );
      if (!selectedVehicleId && vehiclesRes.data?.[0]?._id) {
        setSelectedVehicleId(vehiclesRes.data[0]._id);
      }
      setTrafficRecommendation({
        bestParking: trafficPayload?.bestParking || null,
        eta: trafficPayload?.eta || "",
        trafficDelay: trafficPayload?.trafficDelay || "+0 min",
        routeQuality: trafficPayload?.routeQuality || "Unknown",
        explanation: trafficPayload?.explanation || "",
        trafficEnabled: Boolean(trafficPayload?.trafficEnabled),
        refreshedAt: trafficPayload?.refreshedAt || "",
      });
      setDecisionProfile(
        decisionProfileRes.data || {
          prefersCheap: false,
          prefersFast: false,
          preferredAreas: [],
          avgBookingTime: 0,
          walkingTolerance: "balanced",
          avoidsTraffic: false,
          confidence: 0,
          decisionStyle: [],
          summary: "",
        }
      );
      setLiveDecisionSwitch(
        liveSwitchRes.data || {
          shouldSwitch: false,
          message: "",
          explanation: "",
          currentOption: null,
          betterOption: null,
          savedMinutes: 0,
          savedAmount: 0,
        }
      );
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Could not load user workspace");
    } finally {
      setLoading(false);
    }
  }, [activePreferredAreasKey, carType, location.lat, location.lng, maxDistance, maxPrice, selectedVehicleId, selectedVehicleQuery, strategyMode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);
    const intervalId = window.setInterval(() => {
      void loadWorkspace();
    }, 20000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadWorkspace]);

  useEffect(() => {
    const socket = getRealtimeSocket(session?.token);
    if (!socket) {
      return undefined;
    }

    const handleRefresh = () => {
      void loadWorkspace();
      void refreshProfile();
    };

    socket.on("parking:changed", handleRefresh);
    socket.on("booking:changed", handleRefresh);
    socket.on("trip:changed", handleRefresh);

    return () => {
      socket.off("parking:changed", handleRefresh);
      socket.off("booking:changed", handleRefresh);
      socket.off("trip:changed", handleRefresh);
    };
  }, [loadWorkspace, refreshProfile, session?.token]);

  useEffect(() => {
    if (!session?.token) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await platformService.getOnboardingStatus();
        setOnboardingOpen(Boolean(response.data?.showOnboarding));
      } catch {
        setOnboardingOpen(false);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [session?.token]);

  useEffect(() => {
    const searchSignature = JSON.stringify({
      fullText: location.fullText || "",
      area: location.area || "",
      lat: Number(location.lat || 0).toFixed(4),
      lng: Number(location.lng || 0).toFixed(4),
      carType,
      maxPrice,
      maxDistance,
    });

    if (!session?.token || searchSignature === lastTrackedSearch.current) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      lastTrackedSearch.current = searchSignature;
      void platformService.trackSearch({
        query: location.fullText || location.area || "Current location",
        location,
        filters: {
          carType,
          maxPrice,
          maxDistance,
        },
      });
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [carType, location, maxDistance, maxPrice, session?.token]);

  useEffect(() => {
    if (!activeTrip?._id || !navigator.geolocation) {
      return undefined;
    }

    const syncLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void mobilityService.reportTripLocation(activeTrip._id, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            fullText: "Live trip location",
          });
        },
        () => {}
      );
    };

    syncLocation();
    const intervalId = window.setInterval(syncLocation, 20000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeTrip?._id]);

  useEffect(() => {
    if (!session?.token) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setDecisionSimulation((current) => ({ ...current, loading: true }));
        const response = await eliteAIService.simulate({
          lat: location.lat,
          lng: location.lng,
          carType,
          maxPrice,
          maxDistance,
          minutesOffset: simulationOffset,
          mode: strategyMode,
        });
        setDecisionSimulation({
          loading: false,
          scenarioLabel: response.data?.scenarioLabel || "",
          baseline: response.data?.baseline || null,
          scenario: response.data?.scenario || null,
          summary: normalizeList(response.data?.summary),
          explanation: response.data?.explanation || "",
          areaIntelligence: response.data?.areaIntelligence || null,
          timeValueOptimizer: response.data?.timeValueOptimizer || "",
        });
      } catch {
        setDecisionSimulation((current) => ({ ...current, loading: false }));
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [carType, location.lat, location.lng, maxDistance, maxPrice, session?.token, simulationOffset, strategyMode]);

  useEffect(() => {
    if (!session?.token) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const [intentRes, zeroClickRes, futureRes, collectiveRes, treeRes] = await Promise.all([
          eliteAIService
            .getIntentPrediction({
              lat: location.lat,
              lng: location.lng,
              fullText: location.fullText,
            })
            .catch(() => ({ data: null })),
          eliteAIService
            .getZeroClickSuggestion({
              lat: location.lat,
              lng: location.lng,
              carType,
              maxPrice,
              maxDistance,
              mode: strategyMode,
            })
            .catch(() => ({ data: null })),
          eliteAIService
            .getFutureSimulation({
              lat: location.lat,
              lng: location.lng,
              carType,
              maxPrice,
              maxDistance,
              minutesOffset: simulationOffset,
              mode: strategyMode,
            })
            .catch(() => ({ data: null })),
          eliteAIService.getCollectiveIntelligence().catch(() => ({ data: null })),
          eliteAIService
            .getDecisionTree({
              lat: location.lat,
              lng: location.lng,
              carType,
              maxPrice,
              maxDistance,
            })
            .catch(() => ({ data: null })),
        ]);

        setIntentPrediction(
          intentRes.data || {
            detected: false,
            confidence: 0,
            timeContext: null,
            predictedDestination: null,
            message: "",
            reasoning: [],
            behavioralModel: "",
          }
        );
        setZeroClickSuggestion(
          zeroClickRes.data || {
            available: false,
            confidence: 0,
            predictedDestination: null,
            parking: null,
            statusMessage: "",
            explanation: "",
            requiresConfirmation: true,
            confirmLabel: "Confirm parking",
            cancelLabel: "Not now",
          }
        );
        setFutureSimulation(
          futureRes.data || {
            scenarioLabel: "",
            uncertainty: null,
            selfOptimizingFeedback: "",
            decisionConflict: "",
            comparisonStack: [],
          }
        );
        setCollectiveInsight(
          collectiveRes.data || {
            summary: "",
            insight: "",
            movementTrends: [],
          }
        );
        setDecisionTree(
          treeRes.data || {
            branches: [],
            conflictResolution: "",
            behavioralModel: "",
          }
        );
      } catch {
        // Future-grade features are intentionally non-blocking.
      }
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    carType,
    location.fullText,
    location.lat,
    location.lng,
    maxDistance,
    maxPrice,
    session?.token,
    simulationOffset,
    strategyMode,
  ]);

  useEffect(() => {
    setZeroClickDismissed(false);
  }, [zeroClickSuggestion?.parking?._id, zeroClickSuggestion?.predictedDestination?.label]);

  useEffect(() => {
    if (decisionReplayTargetId || !sortedRecommendationsPreview[0]?._id) {
      return;
    }

    setDecisionReplayTargetId(sortedRecommendationsPreview[0]._id);
  }, [decisionReplayTargetId, sortedRecommendationsPreview]);

  useEffect(() => {
    const targetParkingId = decisionReplayTargetId || sortedRecommendationsPreview[0]?._id;
    if (!session?.token || !targetParkingId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setDecisionReplay((current) => ({ ...current, loading: true }));
        const response = await eliteAIService.getReplay({
          parkingId: targetParkingId,
          lat: location.lat,
          lng: location.lng,
          carType,
          maxPrice,
          maxDistance,
          mode: strategyMode,
        });
        setDecisionReplay({
          loading: false,
          confidence: response.data?.confidence || 0,
          confidenceMessage: response.data?.confidenceMessage || "",
          replaySteps: normalizeList(response.data?.replaySteps),
          comparisonStack: normalizeList(response.data?.comparisonStack),
          areaIntelligence: response.data?.areaIntelligence || null,
          stress: response.data?.stress || { score: 0, level: "Low" },
          timeValueOptimizer: response.data?.timeValueOptimizer || "",
          explanation: response.data?.explanation || "",
          strategyLabel: response.data?.strategyLabel || "Smart Balance",
          loadingMessage: "",
        });
      } catch {
        setDecisionReplay((current) => ({ ...current, loading: false }));
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    carType,
    decisionReplayTargetId,
    location.lat,
    location.lng,
    maxDistance,
    maxPrice,
    session?.token,
    sortedRecommendationsPreview,
    strategyMode,
  ]);

  const sortedRecommendations = sortedRecommendationsPreview;

  const favoriteIds = user?.favoriteParkings || [];
  const recommendations = sortedRecommendations.slice(0, 4);
  const decisionComparisonStack = useMemo(() => {
    return decisionReplay.comparisonStack?.length
      ? decisionReplay.comparisonStack
      : buildComparisonStack(sortedRecommendations.slice(0, 8));
  }, [decisionReplay.comparisonStack, sortedRecommendations]);
  const personalizedRecommendations =
    personalization.recommendations?.length
      ? personalization.recommendations.slice(0, 4)
      : parkings.filter((parking) => parking.ai?.personalized).slice(0, 3);
  const latestConfirmedBooking = bookings.find((booking) => booking.status === "confirmed");
  const timelinePreview = timeline.slice(0, 5);
  const topBookingHours = (personalization.bookingTimePatterns || []).slice(0, 3);
  const bookingRequestPayload = useMemo(
    () => ({
      date: bookingWindow.date,
      startClockTime: bookingWindow.startTimeValue,
      duration: Number(bookingWindow.duration || 1),
    }),
    [bookingWindow.date, bookingWindow.duration, bookingWindow.startTimeValue]
  );
  const checkoutSummary = useMemo(
    () => ({
      totalPrice: availabilityPreview.totalPrice || getBookingAmountFallback(selectedParking, bookingWindow.duration),
      hourlyRate: availabilityPreview.hourlyRate || Number(selectedParking?.pricePerHour || selectedParking?.fare || 0),
    }),
    [availabilityPreview.hourlyRate, availabilityPreview.totalPrice, bookingWindow.duration, selectedParking]
  );
  const leadParking = trafficRecommendation.bestParking || recommendations[0] || null;
  const aiConfidenceLevel =
    decisionReplay.confidence >= 85
      ? "strong"
      : decisionReplay.confidence < 70
        ? "cautious"
        : "balanced";

  const resolveParkingCandidate = useCallback(
    (candidate) => {
      const candidateId = String(toParkingId(candidate));
      const sources = [
        ...parkings,
        ...recommendations,
        ...sortedRecommendations,
        ...personalizedRecommendations,
        trafficRecommendation.bestParking,
        mobilityInsights.oneTapRecommendation?.parking,
        zeroClickSuggestion.parking,
        leadParking,
        typeof candidate === "object" ? candidate : null,
      ].filter(Boolean);

      if (!candidateId) {
        return typeof candidate === "object" ? candidate : null;
      }

      return (
        sources.find((parking) => String(toParkingId(parking)) === candidateId) ||
        null
      );
    },
    [
      leadParking,
      mobilityInsights.oneTapRecommendation?.parking,
      parkings,
      personalizedRecommendations,
      recommendations,
      sortedRecommendations,
      trafficRecommendation.bestParking,
      zeroClickSuggestion.parking,
    ]
  );

  const openCheckout = (parking) => {
    const resolvedParking = resolveParkingCandidate(parking);

    if (!resolvedParking) {
      showToast({
        tone: "warning",
        title: "Parking is refreshing",
        description: "The AI suggestion is updating. Try again in a moment.",
      });
      return;
    }

    setSelectedParking(resolvedParking);
    setDecisionReplayTargetId(resolvedParking?._id || "");
    setBookingWindow(buildBookingWindow());
    setAvailabilityPreview({
      availableSlots: null,
      assignedSlotCode: "",
      hourlyRate: Number(resolvedParking?.pricePerHour || resolvedParking?.fare || 0),
      totalPrice: getBookingAmountFallback(resolvedParking, 1),
      recommendedTime: "",
    });
    setReservationExpiresAt("");
    setPendingOrderId("");
    setCheckoutState("idle");
    setMessage("");
  };

  const closeCheckout = () => {
    if (checkoutState === "processing") {
      return;
    }

    setSelectedParking(null);
    setCheckoutState("idle");
    setBookingId("");
    setReservationExpiresAt("");
    setPendingOrderId("");
  };

  const confirmCheckout = async () => {
    if (!selectedParking) {
      return;
    }

    try {
      const payload = {
        parkingId: selectedParking._id,
        ...bookingRequestPayload,
        vehicleId: selectedVehicleId || undefined,
      };

      if (checkoutState === "idle") {
        const response = await API.post("/booking/payment/order", payload);
        setPendingOrderId(response.data?.order?.id || "");
        setReservationExpiresAt(response.data?.reservation?.booking?.expiresAt || "");
        setAvailabilityPreview((prev) => ({
          ...prev,
          assignedSlotCode:
            response.data?.reservation?.assignedSlotCode ||
            response.data?.reservation?.booking?.assignedSlotCode ||
            prev.assignedSlotCode,
        }));
        setCheckoutState("reserved");
        return;
      }

      setCheckoutState("processing");
      setBookingId(selectedParking._id);
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
      const response = await API.post("/booking/payment/verify", {
        ...payload,
        orderId: pendingOrderId,
      });
      await Promise.all([loadWorkspace(), refreshProfile()]);
      setCheckoutState("success");
      showToast({
        tone: "success",
        title: "Booking confirmed",
        description: response.data?.msg || "Payment simulation completed successfully.",
      });
      window.setTimeout(() => {
        setSelectedParking(null);
        setCheckoutState("idle");
        setBookingId("");
        setReservationExpiresAt("");
        setPendingOrderId("");
      }, 1200);
    } catch (err) {
      const nextMessage = err.response?.data?.msg || "Booking could not be completed";
      setCheckoutState("idle");
      setBookingId("");
      setMessage(nextMessage);
      showToast({
        tone: "error",
        title: "Booking failed",
        description: nextMessage,
      });
    }
  };

  useEffect(() => {
    if (!selectedParking) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await API.get("/booking/availability", {
          params: {
            parkingId: selectedParking._id,
            ...bookingRequestPayload,
          },
        });
        setAvailabilityPreview({
          availableSlots: response.data?.availableSlots ?? null,
          assignedSlotCode: response.data?.assignedSlotCode || "",
          hourlyRate: response.data?.hourlyRate || Number(selectedParking.pricePerHour || selectedParking.fare || 0),
          totalPrice: response.data?.totalPrice || getBookingAmountFallback(selectedParking, bookingRequestPayload.duration),
          recommendedTime: response.data?.recommendedTime || "",
        });
        setBookingWindow((current) => ({
          ...current,
          startTime: response.data?.startTime || current.startTime,
          endTime: response.data?.endTime || current.endTime,
          duration: response.data?.duration || current.duration,
        }));
      } catch (err) {
        setAvailabilityPreview((prev) => ({
          ...prev,
          availableSlots: 0,
          recommendedTime: err.response?.data?.msg || "This time window is not available.",
        }));
      }
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bookingRequestPayload, selectedParking]);

  const updateBookingWindow = (patch) => {
    setCheckoutState((current) => (current === "reserved" ? "idle" : current));
    setPendingOrderId("");
    setReservationExpiresAt("");
    setBookingWindow((current) => hydrateBookingWindow({ ...current, ...patch }));
  };

  const handleFavorite = async (parkingId) => {
    await toggleFavorite(parkingId);
    showToast({
      tone: "success",
      title: favoriteIds.includes(parkingId) ? "Removed from favorites" : "Saved to favorites",
      description: "Your list has been updated.",
    });
  };

  const completeOnboarding = async () => {
    await platformService.completeOnboarding();
    setOnboardingOpen(false);
  };

  const applyPredictedIntent = () => {
    if (!intentPrediction?.predictedDestination?.location) {
      return;
    }

    setLocation((current) => ({
      ...current,
      lat: Number(intentPrediction.predictedDestination.location.lat || current.lat),
      lng: Number(intentPrediction.predictedDestination.location.lng || current.lng),
      fullText:
        intentPrediction.predictedDestination.fullText ||
        intentPrediction.predictedDestination.label ||
        current.fullText,
    }));
    showToast({
      tone: "success",
      title: "Predicted destination applied",
      description: `Discovery is now focused near ${intentPrediction.predictedDestination.label}.`,
    });
  };

  const setStrategyModeWithSync = (mode) => {
    setStrategyMode(mode);
    if (mode === "cheapest") {
      setRecommendationMode("cheapest");
      return;
    }

    if (mode === "fastest") {
      setRecommendationMode("closest");
      return;
    }

    setRecommendationMode("balanced");
  };

  const activateSmartParkingMode = () => {
    setStrategyModeWithSync("balanced");
    const bestCandidate = sortedRecommendations[0];
    if (bestCandidate) {
      openCheckout(bestCandidate);
    }
  };

  const startTripForBooking = async (bookingId) => {
    try {
      await mobilityService.startTrip({
        bookingId,
        vehicleId: selectedVehicleId || undefined,
      });
      await loadWorkspace();
      showToast({
        tone: "success",
        title: "Trip started",
        description: "Trip mode is now tracking your journey to parking.",
      });
    } catch (err) {
      showToast({
        tone: "error",
        title: "Trip start failed",
        description: err.response?.data?.msg || "Trip mode could not be started.",
      });
    }
  };

  const updateTripStage = async (status) => {
    if (!activeTrip?._id) {
      return;
    }

    try {
      await mobilityService.updateTripStatus(activeTrip._id, status);
      await loadWorkspace();
      showToast({
        tone: "success",
        title: "Trip updated",
        description: `Trip marked as ${status}.`,
      });
    } catch (err) {
      showToast({
        tone: "error",
        title: "Trip update failed",
        description: err.response?.data?.msg || "Trip state could not be updated.",
      });
    }
  };

  const extendActiveTrip = async (extraMinutes = 30) => {
    if (!activeTrip?._id) {
      return;
    }

    try {
      await mobilityService.extendTrip(activeTrip._id, extraMinutes);
      await loadWorkspace();
      showToast({
        tone: "success",
        title: "Parking extended",
        description: `Added ${extraMinutes} minutes to the active trip.`,
      });
    } catch (err) {
      showToast({
        tone: "error",
        title: "Extension failed",
        description: err.response?.data?.msg || "Parking could not be extended.",
      });
    }
  };

  const completeActiveTrip = async () => {
    if (!activeTrip?._id) {
      return;
    }

    try {
      await mobilityService.completeTrip(activeTrip._id);
      await loadWorkspace();
      showToast({
        tone: "success",
        title: "Trip completed",
        description: "Parking session closed successfully.",
      });
    } catch (err) {
      showToast({
        tone: "error",
        title: "Trip completion failed",
        description: err.response?.data?.msg || "Trip could not be completed.",
      });
    }
  };

  const submitTripReview = async ({ tripId, rating, review }) => {
    try {
      await mobilityService.submitReview(tripId, { rating, review });
      await loadWorkspace();
      showToast({
        tone: "success",
        title: "Thanks for the rating",
        description: "Your parking review was saved.",
      });
    } catch (err) {
      showToast({
        tone: "error",
        title: "Review failed",
        description: err.response?.data?.msg || "Review could not be saved.",
      });
    }
  };

  const addVehicle = async (payload) => {
    try {
      await mobilityService.createVehicle(payload);
      await loadWorkspace();
      showToast({
        tone: "success",
        title: "Vehicle added",
        description: "Vehicle profile is now available for trip mode.",
      });
    } catch (err) {
      showToast({
        tone: "error",
        title: "Vehicle save failed",
        description: err.response?.data?.msg || "Vehicle could not be saved.",
      });
    }
  };

  const removeVehicle = async (vehicleId) => {
    try {
      await mobilityService.removeVehicle(vehicleId);
      if (selectedVehicleId === vehicleId) {
        setSelectedVehicleId("");
      }
      await loadWorkspace();
      showToast({
        tone: "success",
        title: "Vehicle removed",
        description: "Vehicle was removed from your mobility profile.",
      });
    } catch (err) {
      showToast({
        tone: "error",
        title: "Vehicle remove failed",
        description: err.response?.data?.msg || "Vehicle could not be removed.",
      });
    }
  };

  const addSavedLocation = async (payload) => {
    try {
      await mobilityService.createSavedLocation(payload);
      await loadWorkspace();
      showToast({
        tone: "success",
        title: "Location saved",
        description: "Destination shortcut is now available for one-tap parking.",
      });
    } catch (err) {
      showToast({
        tone: "error",
        title: "Save location failed",
        description: err.response?.data?.msg || "Location could not be saved.",
      });
    }
  };

  const removeSavedLocation = async (locationId) => {
    try {
      await mobilityService.removeSavedLocation(locationId);
      await loadWorkspace();
      showToast({
        tone: "success",
        title: "Location removed",
        description: "Saved place was removed.",
      });
    } catch (err) {
      showToast({
        tone: "error",
        title: "Location remove failed",
        description: err.response?.data?.msg || "Location could not be removed.",
      });
    }
  };

  const runOneTapParking = () => {
    const targetParking =
      zeroClickSuggestion?.parking ||
      mobilityInsights.oneTapRecommendation?.parking ||
      trafficRecommendation.bestParking ||
      recommendations[0];

    openCheckout(targetParking);
  };

  const confirmZeroClickSuggestion = () => {
    if (zeroClickSuggestion?.parking) {
      openCheckout(zeroClickSuggestion.parking);
      setZeroClickDismissed(false);
    }
  };

  const dismissZeroClickSuggestion = () => {
    setZeroClickDismissed(true);
  };

  const refreshDecisionReplay = async (parkingId = decisionReplayTargetId || leadParking?._id) => {
    if (!parkingId) {
      return;
    }

    try {
      setDecisionReplayTargetId(parkingId);
      setDecisionReplay((current) => ({ ...current, loading: true }));
      const response = await eliteAIService.getReplay({
        parkingId,
        lat: location.lat,
        lng: location.lng,
        carType,
        maxPrice,
        maxDistance,
        mode: strategyMode,
      });
      setDecisionReplay({
        loading: false,
        confidence: response.data?.confidence || 0,
        confidenceMessage: response.data?.confidenceMessage || "",
        replaySteps: normalizeList(response.data?.replaySteps),
        comparisonStack: normalizeList(response.data?.comparisonStack),
        areaIntelligence: response.data?.areaIntelligence || null,
        stress: response.data?.stress || { score: 0, level: "Low" },
        timeValueOptimizer: response.data?.timeValueOptimizer || "",
        explanation: response.data?.explanation || "",
        strategyLabel: response.data?.strategyLabel || "Smart Balance",
      });
    } catch {
      setDecisionReplay((current) => ({ ...current, loading: false }));
    }
  };

  const applySimulationRecommendation = (parkingId) => {
    const simulatedParking = resolveParkingCandidate(parkingId);
    openCheckout(simulatedParking || parkingId);
  };

  return {
    location,
    setLocation,
    carType,
    setCarType,
    maxPrice,
    setMaxPrice,
    maxDistance,
    setMaxDistance,
    parkings,
    bookings,
    hotspots,
    loading,
    message,
    setMessage,
    recommendationMode,
    setRecommendationMode,
    strategyMode,
    setStrategyMode: setStrategyModeWithSync,
    recommendations,
    sortedRecommendations,
    decisionComparisonStack,
    personalizedRecommendations,
    favoriteIds,
    preferredAreas,
    activePreferredAreas,
    personalization,
    behaviorSummary,
    timeline,
    timelinePreview,
    topBookingHours,
    platformStatus,
    trafficRecommendation,
    leadParking,
    aiConfidenceLevel,
    vehicles,
    savedLocations,
    selectedVehicleId,
    selectedVehicle,
    setSelectedVehicleId,
    activeTrip,
    tripHistory,
    currentBilling,
    mobilityInsights,
    decisionProfile,
    decisionSimulation,
    simulationOffset,
    setSimulationOffset,
    decisionReplay,
    decisionReplayTargetId,
    setDecisionReplayTargetId,
    liveDecisionSwitch,
    intentPrediction,
    zeroClickSuggestion,
    zeroClickDismissed,
    futureSimulation,
    collectiveInsight,
    decisionTree,
    onboardingOpen,
    bookingWindow,
    availabilityPreview,
    reservationExpiresAt,
    checkoutSummary,
    latestConfirmedBooking,
    selectedParking,
    checkoutState,
    bookingId,
    loadWorkspace,
    openCheckout,
    closeCheckout,
    confirmCheckout,
    updateBookingWindow,
    handleFavorite,
    setOnboardingOpen,
    completeOnboarding,
    applyPredictedIntent,
    activateSmartParkingMode,
    refreshDecisionReplay,
    applySimulationRecommendation,
    confirmZeroClickSuggestion,
    dismissZeroClickSuggestion,
    startTripForBooking,
    updateTripStage,
    extendActiveTrip,
    completeActiveTrip,
    submitTripReview,
    addVehicle,
    removeVehicle,
    addSavedLocation,
    removeSavedLocation,
    runOneTapParking,
    recommendationModes,
    strategyModes,
  };
}
