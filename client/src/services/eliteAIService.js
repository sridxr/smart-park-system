import API from "../api";

const eliteAIService = {
  getDecisionProfile() {
    return API.get("/ai/decision-profile");
  },
  getIntentPrediction(params) {
    return API.get("/ai/intent", { params });
  },
  getZeroClickSuggestion(params) {
    return API.get("/ai/zero-click", { params });
  },
  simulate(params) {
    return API.get("/ai/simulate", { params });
  },
  getFutureSimulation(params) {
    return API.get("/ai/future-simulate", { params });
  },
  getReplay(params) {
    return API.get("/ai/replay", { params });
  },
  getLiveSwitch(params) {
    return API.get("/ai/live-switch", { params });
  },
  getCollectiveIntelligence() {
    return API.get("/ai/collective-intelligence");
  },
  getDecisionTree(params) {
    return API.get("/ai/decision-tree", { params });
  },
};

export default eliteAIService;
