import API from "../api";

const analyticsService = {
  getAdminAnalytics() {
    return API.get("/analytics/admin");
  },
  getIoTSummary() {
    return API.get("/analytics/iot");
  },
};

export default analyticsService;
