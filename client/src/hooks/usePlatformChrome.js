import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import platformService from "../services/platformService";
import { getRealtimeSocket } from "../lib/realtime";

export function usePlatformChrome() {
  const { session, user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date().toISOString());
  const [platformStatus, setPlatformStatus] = useState({
    systemOnline: true,
    lastUpdatedAt: new Date().toISOString(),
    aiEngineActive: true,
    lastDecisionAt: new Date().toISOString(),
    unreadCount: 0,
  });

  const loadNotifications = useCallback(async () => {
    if (!user) {
      return;
    }
    const response = await platformService.getNotifications();
    setNotifications(response.data);
    setLastUpdatedAt(new Date().toISOString());
  }, [user]);

  const loadPlatformStatus = useCallback(async () => {
    if (!user) {
      return;
    }

    const response = await platformService.getPlatformStatus();
    setPlatformStatus(response.data);
    setLastUpdatedAt(response.data?.lastUpdatedAt || new Date().toISOString());
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications();
      void loadPlatformStatus();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadNotifications, loadPlatformStatus]);

  useEffect(() => {
    const socket = getRealtimeSocket(session?.token);
    if (!socket) {
      return undefined;
    }
    const handleNotification = () => {
      void loadNotifications();
      void loadPlatformStatus();
    };
    const handlePlatformSignal = () => {
      void loadPlatformStatus();
    };
    socket.on("notification:changed", handleNotification);
    socket.on("parking:changed", handlePlatformSignal);
    socket.on("booking:changed", handlePlatformSignal);
    socket.on("user:changed", handlePlatformSignal);
    return () => {
      socket.off("notification:changed", handleNotification);
      socket.off("parking:changed", handlePlatformSignal);
      socket.off("booking:changed", handlePlatformSignal);
      socket.off("user:changed", handlePlatformSignal);
    };
  }, [loadNotifications, loadPlatformStatus, session?.token]);

  const unreadCount = useMemo(
    () =>
      platformStatus?.unreadCount ??
      notifications.filter((notification) => !notification.readAt && !notification.read).length,
    [notifications, platformStatus?.unreadCount]
  );

  const markNotificationRead = useCallback(
    async (id) => {
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id
            ? {
                ...notification,
                read: true,
                readAt: notification.readAt || new Date().toISOString(),
              }
            : notification
        )
      );
      await platformService.markNotificationRead(id);
      await Promise.all([loadNotifications(), loadPlatformStatus()]);
    },
    [loadNotifications, loadPlatformStatus]
  );

  const navigateFromNotification = useCallback(
    async (notification) => {
      if (!notification) {
        return;
      }

      if (!notification.readAt && !notification.read) {
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id
              ? {
                  ...item,
                  read: true,
                  readAt: item.readAt || new Date().toISOString(),
                }
              : item
          )
        );
        await platformService.markNotificationRead(notification._id);
      }

      setNotificationsOpen(false);

      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }

      await Promise.all([loadNotifications(), loadPlatformStatus()]);
    },
    [loadNotifications, loadPlatformStatus, navigate]
  );

  const confirmLogout = () => {
    logout();
    setLogoutOpen(false);
    navigate("/auth", { replace: true });
  };

  return {
    notifications,
    unreadCount,
    notificationsOpen,
    setNotificationsOpen,
    profileOpen,
    setProfileOpen,
    logoutOpen,
    setLogoutOpen,
    mobileNavOpen,
    setMobileNavOpen,
    lastUpdatedAt,
    platformStatus,
    markNotificationRead,
    navigateFromNotification,
    confirmLogout,
  };
}
