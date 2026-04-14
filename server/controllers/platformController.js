const { searchPlatform } = require("../services/globalSearchService");
const { getPlatformStatus } = require("../services/platformStatusService");

async function status(req, res) {
  try {
    const payload = await getPlatformStatus({ user: req.user });
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function search(req, res) {
  try {
    const results = await searchPlatform({
      user: req.user,
      query: req.query.q || "",
      limit: Number(req.query.limit || 8),
    });

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  search,
  status,
};
