import API from "../api";

const vehicleIntelligenceService = {
  getMaster(params) {
    return API.get("/vehicles/master", { params });
  },
  getLenderSupport() {
    return API.get("/vehicles/lender");
  },
  getUserVehicles() {
    return API.get("/vehicles/user");
  },
  createUserVehicle(payload) {
    return API.post("/vehicles/user", payload);
  },
  removeUserVehicle(vehicleId) {
    return API.delete(`/vehicles/user/${vehicleId}`);
  },
};

export default vehicleIntelligenceService;
