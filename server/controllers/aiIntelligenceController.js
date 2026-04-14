const { buildDecisionProfile } = require("../services/ai/decisionProfileService");
const { buildDecisionReplay } = require("../services/ai/decisionReplayService");
const { buildDecisionTree } = require("../services/ai/decisionTreeService");
const { buildCollectiveIntelligence } = require("../services/ai/collectiveIntelligenceService");
const { buildFutureSimulation } = require("../services/ai/futureSimulationService");
const { buildIntentPrediction } = require("../services/ai/intentService");
const { getLiveDecisionSwitch } = require("../services/ai/liveDecisionSwitchService");
const { runWhatIfSimulation } = require("../services/ai/simulationService");
const { buildZeroClickSuggestion } = require("../services/ai/zeroClickService");

function parseLocation(query) {
  if (!query.lat || !query.lng) {
    return null;
  }

  return {
    lat: Number(query.lat),
    lng: Number(query.lng),
    fullText: query.fullText || "",
  };
}

async function getDecisionProfile(req, res) {
  try {
    const payload = await buildDecisionProfile(req.user._id);
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function getIntentPrediction(req, res) {
  try {
    const payload = await buildIntentPrediction({
      userId: req.user._id,
      userLocation: parseLocation(req.query),
    });
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function getSimulation(req, res) {
  try {
    const payload = await runWhatIfSimulation({
      userId: req.user._id,
      userLocation: parseLocation(req.query),
      carType: req.query.carType || "sedan",
      maxPrice: Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER),
      maxDistance: Number(req.query.maxDistance || Number.MAX_SAFE_INTEGER),
      minutesOffset: Number(req.query.minutesOffset || 30),
      mode: req.query.mode || "balanced",
    });

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function getFutureSimulation(req, res) {
  try {
    const payload = await buildFutureSimulation({
      userId: req.user._id,
      userLocation: parseLocation(req.query),
      carType: req.query.carType || "sedan",
      maxPrice: Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER),
      maxDistance: Number(req.query.maxDistance || Number.MAX_SAFE_INTEGER),
      minutesOffset: Number(req.query.minutesOffset || 60),
      mode: req.query.mode || "balanced",
    });
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function getDecisionReplay(req, res) {
  try {
    const payload = await buildDecisionReplay({
      userId: req.user._id,
      parkingId: req.query.parkingId,
      userLocation: parseLocation(req.query),
      carType: req.query.carType || "sedan",
      maxPrice: Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER),
      maxDistance: Number(req.query.maxDistance || Number.MAX_SAFE_INTEGER),
      mode: req.query.mode || "balanced",
    });

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function getDecisionSwitch(req, res) {
  try {
    const payload = await getLiveDecisionSwitch({
      userId: req.user._id,
      userLocation: parseLocation(req.query),
      carType: req.query.carType || "sedan",
      maxPrice: Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER),
      maxDistance: Number(req.query.maxDistance || Number.MAX_SAFE_INTEGER),
      mode: req.query.mode || "balanced",
    });

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function getCollectiveInsight(req, res) {
  try {
    return res.json(await buildCollectiveIntelligence());
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function getZeroClickSuggestion(req, res) {
  try {
    const payload = await buildZeroClickSuggestion({
      userId: req.user._id,
      userLocation: parseLocation(req.query),
      carType: req.query.carType || "sedan",
      maxPrice: Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER),
      maxDistance: Number(req.query.maxDistance || Number.MAX_SAFE_INTEGER),
      mode: req.query.mode || "balanced",
    });
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function getDecisionTree(req, res) {
  try {
    const payload = await buildDecisionTree({
      userId: req.user._id,
      userLocation: parseLocation(req.query),
      carType: req.query.carType || "sedan",
      maxPrice: Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER),
      maxDistance: Number(req.query.maxDistance || Number.MAX_SAFE_INTEGER),
    });
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

module.exports = {
  getCollectiveInsight,
  getDecisionProfile,
  getDecisionReplay,
  getDecisionSwitch,
  getDecisionTree,
  getFutureSimulation,
  getIntentPrediction,
  getSimulation,
  getZeroClickSuggestion,
};
