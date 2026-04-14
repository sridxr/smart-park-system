/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from "react";

import API from "../api";
import {
  clearSession,
  getSessionPersistenceMode,
  getStoredSession,
  saveSession,
} from "../auth";
import { closeRealtimeSocket } from "../lib/realtime";
import { getDashboardPath } from "../lib/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [user, setUser] = useState(() => getStoredSession()?.user || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const existing = getStoredSession();

      if (!existing?.token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const res = await API.get("/auth/me");
        const nextSession = {
          token: existing.token,
          user: res.data.user,
        };
        saveSession(nextSession, {
          persist: getSessionPersistenceMode() !== "session",
        });

        if (active) {
          setSession(nextSession);
          setUser(res.data.user);
        }
      } catch {
        clearSession();
        if (active) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const persist = (nextSession, options = {}) => {
    saveSession(nextSession, options);
    setSession(nextSession);
    setUser(nextSession.user);
  };

  const login = async (payload, options = {}) => {
    const res = await API.post("/auth/login", payload);
    persist(res.data, options);
    return res.data;
  };

  const signup = async (payload) => {
    return API.post("/auth/signup", payload);
  };

  const verifyEmail = async (token) => {
    const res = await API.post("/auth/verify-email", { token });
    if (res.data.token) {
      persist({
        token: res.data.token,
        user: res.data.user,
      });
    }
    return res.data;
  };

  const resendVerification = async (email) => {
    const res = await API.post("/auth/resend-verification", { email });
    return res.data;
  };

  const logout = () => {
    closeRealtimeSocket();
    clearSession();
    setSession(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const res = await API.get("/auth/me");
    const nextSession = {
      token: getStoredSession()?.token,
      user: res.data.user,
    };
    persist(nextSession, {
      persist: getSessionPersistenceMode() !== "session",
    });
    return res.data.user;
  };

  const toggleFavorite = async (parkingId) => {
    const res = await API.post(`/auth/favorites/${parkingId}`);
    setUser((prev) =>
      prev
        ? { ...prev, favoriteParkings: res.data.favorites }
        : prev
    );
    return res.data.favorites;
  };

  const updateProfile = async (payload) => {
    const res = await API.patch("/auth/me", payload);
    const nextSession = {
      token: getStoredSession()?.token,
      user: res.data.user,
    };
    persist(nextSession, {
      persist: getSessionPersistenceMode() !== "session",
    });
    return res.data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        login,
        signup,
        logout,
        verifyEmail,
        resendVerification,
        refreshProfile,
        toggleFavorite,
        updateProfile,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
