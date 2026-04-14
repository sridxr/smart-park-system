const GOOGLE_DISTANCE_MATRIX_URL =
  "https://maps.googleapis.com/maps/api/distancematrix/json";
const CACHE_TTL_MS = 25 * 1000;

const trafficCache = new Map();

function normalizeCoordinate(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeLocation(location = {}) {
  const lat = normalizeCoordinate(location.lat);
  const lng = normalizeCoordinate(location.lng);

  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng };
}

function buildCacheKey(origin, destination) {
  return `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}:${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;
}

function getCachedTraffic(origin, destination) {
  const cacheKey = buildCacheKey(origin, destination);
  const cached = trafficCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    trafficCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCachedTraffic(origin, destination, data) {
  trafficCache.set(buildCacheKey(origin, destination), {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function getRouteQuality(delayMinutes = 0) {
  if (delayMinutes <= 2) {
    return "Low";
  }

  if (delayMinutes <= 6) {
    return "Moderate";
  }

  return "High";
}

function parseTrafficElement(element) {
  if (!element || element.status !== "OK") {
    return null;
  }

  const distanceValue = Number(element.distance?.value || 0);
  const durationValue = Number(element.duration?.value || 0);
  const trafficDurationValue = Number(
    element.duration_in_traffic?.value || durationValue || 0
  );
  const trafficDelaySeconds = Math.max(0, trafficDurationValue - durationValue);
  const trafficDelayMinutes = Number((trafficDelaySeconds / 60).toFixed(1));
  const durationMinutes = Number((durationValue / 60).toFixed(1));
  const trafficDurationMinutes = Number((trafficDurationValue / 60).toFixed(1));

  return {
    distance: {
      text: element.distance?.text || "",
      valueMeters: distanceValue,
      valueKm: Number((distanceValue / 1000).toFixed(2)),
    },
    duration: {
      text: element.duration?.text || "",
      valueSeconds: durationValue,
      valueMinutes: durationMinutes,
    },
    trafficDuration: {
      text: element.duration_in_traffic?.text || element.duration?.text || "",
      valueSeconds: trafficDurationValue,
      valueMinutes: trafficDurationMinutes,
    },
    trafficDelay: {
      text: trafficDelaySeconds > 0 ? `+${trafficDelayMinutes} min` : "+0 min",
      valueSeconds: trafficDelaySeconds,
      valueMinutes: trafficDelayMinutes,
    },
    routeQuality: getRouteQuality(trafficDelayMinutes),
    provider: "google-distance-matrix",
    refreshedAt: new Date().toISOString(),
  };
}

async function requestTrafficMatrix(origin, destinations) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: destinations
      .map((destination) => `${destination.lat},${destination.lng}`)
      .join("|"),
    mode: "driving",
    departure_time: "now",
    traffic_model: "best_guess",
    key: apiKey,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(`${GOOGLE_DISTANCE_MATRIX_URL}?${params.toString()}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Google traffic request failed with status ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getTrafficDataBatch(userLocation, parkingLocations = []) {
  const origin = normalizeLocation(userLocation);

  if (!origin || !Array.isArray(parkingLocations) || parkingLocations.length === 0) {
    return parkingLocations.map(() => null);
  }

  const normalizedDestinations = parkingLocations.map((location) => normalizeLocation(location));
  const cachedResponses = normalizedDestinations.map((destination) =>
    destination ? getCachedTraffic(origin, destination) : null
  );

  const uncachedDestinations = normalizedDestinations.filter(
    (destination, index) => destination && !cachedResponses[index]
  );

  if (!uncachedDestinations.length) {
    return cachedResponses;
  }

  let payload = null;

  try {
    payload = await requestTrafficMatrix(origin, uncachedDestinations);
  } catch {
    return parkingLocations.map(() => null);
  }

  const elements = payload?.rows?.[0]?.elements || [];
  let matrixIndex = 0;

  normalizedDestinations.forEach((destination, index) => {
    if (!destination || cachedResponses[index]) {
      return;
    }

    const parsed = parseTrafficElement(elements[matrixIndex]);
    matrixIndex += 1;

    if (parsed) {
      setCachedTraffic(origin, destination, parsed);
      cachedResponses[index] = parsed;
    } else {
      cachedResponses[index] = null;
    }
  });

  return cachedResponses;
}

async function getTrafficData(userLocation, parkingLocation) {
  const [traffic] = await getTrafficDataBatch(userLocation, [parkingLocation]);
  return traffic;
}

module.exports = {
  getRouteQuality,
  getTrafficData,
  getTrafficDataBatch,
};
