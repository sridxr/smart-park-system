const UserBehavior = require("../models/UserBehavior");
const SystemLog = require("../models/SystemLog");

async function getDecisionStatus({ userId, role }) {
  const [behavior, latestLog] = await Promise.all([
    role === "user" ? UserBehavior.findOne({ user: userId }).select("preferredLocations updatedAt searchedLocations bookedLocations") : null,
    SystemLog.findOne({
      $or: [{ actor: userId }, { targetId: userId.toString() }],
    })
      .sort({ createdAt: -1 })
      .select("action createdAt"),
  ]);

  const personalizationActive = Boolean(
    behavior &&
      ((behavior.preferredLocations || []).length ||
        (behavior.searchedLocations || []).length ||
        (behavior.bookedLocations || []).length)
  );

  const lastDecisionAt = behavior?.updatedAt || latestLog?.createdAt || new Date();
  const decisionSource = behavior?.updatedAt
    ? "behavior-tracking"
    : latestLog?.action
      ? latestLog.action
      : "system";

  return {
    aiEngineActive: true,
    lastDecisionAt,
    decisionSource,
    personalizationActive,
  };
}

module.exports = {
  getDecisionStatus,
};
