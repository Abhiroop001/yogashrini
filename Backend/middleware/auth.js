// Server/middleware/auth.js
// Standard JWT Verification, Optional Session Extraction, and Role-Based Authorization
const jwt = require("jsonwebtoken");
const config = require("../config");

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1].trim();
  }
  if (req.query && typeof req.query.token === "string" && req.query.token.trim()) {
    return req.query.token.trim();
  }
  return null;
}

async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: "Access denied. Bearer token required." });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const resolvedId = decoded && (decoded.id || decoded._id) ? String(decoded.id || decoded._id) : "";
    req.user = { ...decoded, id: resolvedId };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid, expired, or malformed authentication token." });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const resolvedId = decoded && (decoded.id || decoded._id) ? String(decoded.id || decoded._id) : "";
      req.user = { ...decoded, id: resolvedId };
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Forbidden: Admin privileges required." });
  }
  next();
}

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin
};
