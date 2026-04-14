const STORAGE_KEY = "smartParkingSession";
const SESSION_MODE_KEY = "smartParkingSessionMode";

function parseStoredSession(rawSession) {
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession);
    if (!parsed?.token) {
      return null;
    }

    return {
      token: parsed.token,
      user: parsed.user || null,
    };
  } catch {
    return null;
  }
}

function readFromStorage(storage) {
  return parseStoredSession(storage.getItem(STORAGE_KEY));
}

function writeAuxiliarySessionKeys(storage, session) {
  if (!session?.token) {
    return;
  }

  storage.setItem("token", session.token);

  if (session?.user) {
    storage.setItem("role", session.user.role);
    storage.setItem("userId", session.user.id);
  }
}

function clearAuxiliarySessionKeys(storage) {
  storage.removeItem(STORAGE_KEY);
  storage.removeItem("token");
  storage.removeItem("role");
  storage.removeItem("userId");
}

export function getStoredSession() {
  return readFromStorage(localStorage) || readFromStorage(sessionStorage);
}

export function getToken() {
  return getStoredSession()?.token || "";
}

export function saveSession(session, options = {}) {
  const persist = options.persist !== false;
  const primaryStorage = persist ? localStorage : sessionStorage;
  const secondaryStorage = persist ? sessionStorage : localStorage;

  clearAuxiliarySessionKeys(secondaryStorage);
  primaryStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  writeAuxiliarySessionKeys(primaryStorage, session);
  localStorage.setItem(SESSION_MODE_KEY, persist ? "local" : "session");
}

export function getSessionPersistenceMode() {
  const explicitMode = localStorage.getItem(SESSION_MODE_KEY);

  if (explicitMode === "session") {
    return "session";
  }

  if (explicitMode === "local") {
    return "local";
  }

  if (readFromStorage(sessionStorage)) {
    return "session";
  }

  return "local";
}

export function clearSession() {
  clearAuxiliarySessionKeys(localStorage);
  clearAuxiliarySessionKeys(sessionStorage);
  localStorage.removeItem(SESSION_MODE_KEY);
}
