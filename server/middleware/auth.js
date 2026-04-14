const jwt = require("jsonwebtoken");

const User = require("../models/user");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ msg: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ msg: "User session is invalid" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ msg: "Your account is currently blocked" });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ msg: "You are not allowed to perform this action" });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
