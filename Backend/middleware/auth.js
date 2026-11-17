// Server/middleware/auth.js
// Standard JWT Verification and Role-Based Authorization
const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../db/userdb");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Access denied. Bearer token required." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Attach user payload to request
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid, expired, or malformed authentication token." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Forbidden: Admin privileges required." });
  }
  next();
}

module.exports = {
  authenticate,
  requireAdmin
};
