import API from "../api";

const cacheStore = new Map();

function getCacheKey(prefix, value = "") {
  return `${prefix}:${value}`;
}

function getCachedValue(key, ttlMs) {
  const cached = cacheStore.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp > ttlMs) {
    cacheStore.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedValue(key, value) {
  cacheStore.set(key, {
    value,
    timestamp: Date.now(),
  });
}

const platformService = {
  getPersonalization(params) {
    return API.get("/ai-platform/personalization", { params });
  },
  trackSearch(payload) {
    return API.post("/ai-platform/behavior/search", payload);
  },
  getBehaviorSummary() {
    return API.get("/ai-platform/behavior/summary");
  },
  getTimeline() {
    return API.get("/ai-platform/timeline");
  },
  getNotifications() {
    return API.get("/ai-platform/notifications");
  },
  markNotificationRead(id) {
    return API.patch(`/ai-platform/notifications/${id}/read`);
  },
  getFraudLogs() {
    return API.get("/ai-platform/fraud-logs");
  },
  getSystemLogs() {
    return API.get("/ai-platform/system-logs");
  },
  getOnboardingStatus() {
    return API.get("/ai-platform/onboarding/status");
  },
  completeOnboarding() {
    return API.post("/ai-platform/onboarding/complete");
  },
  getPlatformStatus() {
    return API.get("/platform/status");
  },
  getTrafficRecommendations(params) {
    return API.get("/ai-platform/traffic/recommendations", { params });
  },
  searchPlatform(query, limit = 8) {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    const cacheKey = getCacheKey("platform-search", `${normalizedQuery}:${limit}`);
    const cached = getCachedValue(cacheKey, 20_000);

    if (cached) {
      return Promise.resolve({ data: cached });
    }

    return API.get("/platform/search", {
      params: { q: query, limit },
    }).then((response) => {
      setCachedValue(cacheKey, response.data);
      return response;
    });
  },
};

export default platformService;
