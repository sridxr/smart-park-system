import { useCallback, useEffect, useMemo, useState } from "react";

import API from "../api";
import { getRealtimeSocket } from "../lib/realtime";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/ToastProvider";
import mobilityService from "../services/mobilityService";
import platformService from "../services/platformService";
import analyticsService from "../services/analyticsService";

export function useAdminWorkspace() {
  const { session } = useAuth();
  const { showToast } = useToast();
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
  const [fraudLogs, setFraudLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [advancedAnalytics, setAdvancedAnalytics] = useState({
    totalRevenue: 0,
    peakHours: [],
    averageParkingDuration: 0,
    conversionRate: 0,
    occupancyAverage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [platformStatus, setPlatformStatus] = useState({
    systemOnline: true,
    lastUpdatedAt: new Date().toISOString(),
    aiEngineActive: true,
    lastDecisionAt: new Date().toISOString(),
    unreadCount: 0,
  });
  const [mobilitySummary, setMobilitySummary] = useState({
    activeTrips: 0,
    completedTrips: 0,
    averageTripDurationMinutes: 0,
    averageRating: 0,
    alertPressure: 0,
  });

  const fetchUsers = useCallback(async () => {
    const usersRes = await API.get("/users");
    setUsers(usersRes.data);
  }, []);

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, parkingsRes, bookingsRes, usersRes, fraudLogsRes, systemLogsRes, analyticsRes, platformStatusRes, mobilitySummaryRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/parkings"),
        API.get("/admin/bookings"),
        API.get("/users"),
        platformService.getFraudLogs(),
        platformService.getSystemLogs(),
        analyticsService.getAdminAnalytics(),
        platformService.getPlatformStatus(),
        mobilityService.getAdminTripSummary().catch(() => ({ data: null })),
      ]);
      setStats(statsRes.data);
      setParkings(parkingsRes.data);
      setBookings(bookingsRes.data);
      setUsers(usersRes.data);
      setFraudLogs(fraudLogsRes.data);
      setSystemLogs(systemLogsRes.data);
      setAdvancedAnalytics(analyticsRes.data);
      setPlatformStatus(platformStatusRes.data || {});
      setMobilitySummary(
        mobilitySummaryRes.data || {
          activeTrips: 0,
          completedTrips: 0,
          averageTripDurationMinutes: 0,
          averageRating: 0,
          alertPressure: 0,
        }
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadWorkspace(), 0);
    const intervalId = window.setInterval(() => void loadWorkspace(), 60000);
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
    const handleDashboardRefresh = () => {
      void loadWorkspace();
    };
    const handleUserRefresh = () => {
      void fetchUsers();
      void loadWorkspace();
    };
    socket.on("parking:changed", handleDashboardRefresh);
    socket.on("booking:changed", handleDashboardRefresh);
    socket.on("user:changed", handleUserRefresh);
    return () => {
      socket.off("parking:changed", handleDashboardRefresh);
      socket.off("booking:changed", handleDashboardRefresh);
      socket.off("user:changed", handleUserRefresh);
    };
  }, [fetchUsers, loadWorkspace, session?.token]);

  const toggleUserStatus = async (selectedUser) => {
    await API.patch(`/admin/users/${selectedUser._id}/status`, {
      status: selectedUser.status === "blocked" ? "active" : "blocked",
    });
    await loadWorkspace();
    showToast({
      tone: "success",
      title: selectedUser.status === "blocked" ? "User unblocked" : "User blocked",
      description: `${selectedUser.name}'s access has been updated.`,
    });
  };

  const deleteUser = async (userId) => {
    await API.delete(`/admin/users/${userId}`);
    await loadWorkspace();
    showToast({
      tone: "success",
      title: "User deleted",
      description: "The account was removed from the platform.",
    });
  };

  const blockedUsers = useMemo(
    () => users.filter((row) => row.status === "blocked").length,
    [users]
  );
  const openFraudLogs = useMemo(
    () => fraudLogs.filter((log) => log.status === "open"),
    [fraudLogs]
  );
  const criticalFraudLogs = useMemo(
    () => openFraudLogs.filter((log) => log.severity === "critical"),
    [openFraudLogs]
  );

  return {
    stats,
    users,
    parkings,
    bookings,
    fraudLogs,
    systemLogs,
    advancedAnalytics,
    mobilitySummary,
    platformStatus,
    loading,
    blockedUsers,
    openFraudLogs,
    criticalFraudLogs,
    loadWorkspace,
    toggleUserStatus,
    deleteUser,
  };
}
