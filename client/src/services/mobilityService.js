import API from "../api";

const mobilityService = {
  getTripState() {
    return API.get("/trip/state");
  },
  startTrip(payload) {
    return API.post("/trip/start", payload);
  },
  updateTripStatus(tripId, status) {
    return API.post(`/trip/${tripId}/status`, { status });
  },
  reportTripLocation(tripId, location) {
    return API.post(`/trip/${tripId}/location`, { location });
  },
  extendTrip(tripId, extraMinutes) {
    return API.post(`/trip/${tripId}/extend`, { extraMinutes });
  },
  completeTrip(tripId) {
    return API.post(`/trip/${tripId}/complete`);
  },
  getTripBilling(tripId) {
    return API.get(`/trip/${tripId}/billing`);
  },
  getCurrentBilling() {
    return API.get("/billing/current");
  },
  submitReview(tripId, payload) {
    return API.post(`/trip/${tripId}/review`, payload);
  },
  listVehicles() {
    return API.get("/vehicle");
  },
  createVehicle(payload) {
    return API.post("/vehicle", payload);
  },
  removeVehicle(vehicleId) {
    return API.delete(`/vehicle/${vehicleId}`);
  },
  listSavedLocations() {
    return API.get("/location");
  },
  createSavedLocation(payload) {
    return API.post("/location", payload);
  },
  removeSavedLocation(locationId) {
    return API.delete(`/location/${locationId}`);
  },
  getMobilityInsights(params) {
    return API.get("/ai/mobility/insights", { params });
  },
  getLenderMobilityForecast() {
    return API.get("/ai/mobility/forecast/lender");
  },
  getLenderTripPerformance() {
    return API.get("/trip/lender/performance");
  },
  getAdminTripSummary() {
    return API.get("/trip/admin/summary");
  },
};

export default mobilityService;
