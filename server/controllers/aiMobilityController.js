const { buildLenderMobilityForecast, buildMobilityInsights } = require("../services/ai/mobilityInsightService");

async function getMobilityInsights(req, res) {
  try {
    return res.json(
      await buildMobilityInsights({
        userId: req.user._id,
        userLocation:
          req.query.lat && req.query.lng
            ? { lat: Number(req.query.lat), lng: Number(req.query.lng) }
            : null,
        destination:
          req.query.destinationLat && req.query.destinationLng
            ? {
                lat: Number(req.query.destinationLat),
                lng: Number(req.query.destinationLng),
                fullText: req.query.destinationText || "",
              }
            : null,
        vehicleId: req.query.vehicleId || null,
        maxPrice: Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER),
      })
    );
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

async function getLenderForecast(req, res) {
  try {
    return res.json(await buildLenderMobilityForecast(req.user._id));
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

module.exports = {
  getLenderForecast,
  getMobilityInsights,
};
