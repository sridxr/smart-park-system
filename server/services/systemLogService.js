const SystemLog = require("../models/SystemLog");

async function createSystemLog({
  actor = null,
  actorEmail = "",
  action,
  targetType = "",
  targetId = "",
  description = "",
  metadata = {},
}) {
  return SystemLog.create({
    actor: actor?._id || actor || null,
    actorEmail: actor?.email || actorEmail,
    action,
    targetType,
    targetId,
    description,
    metadata,
  });
}

async function listSystemLogs(limit = 30) {
  return SystemLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actor", "name email role");
}

async function listTimelineForUser(userId, limit = 15) {
  return SystemLog.find({
    $or: [{ actor: userId }, { targetId: userId.toString() }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actor", "name email role");
}

module.exports = {
  createSystemLog,
  listSystemLogs,
  listTimelineForUser,
};
