// Server/config/index.js
// Centralized Environment Configuration & Validation for Yogashrini Platform
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Load .env from Server/.env first, then root if present
const serverEnvPath = path.join(__dirname, "../.env");
const rootEnvPath = path.join(__dirname, "../../.env");

if (fs.existsSync(serverEnvPath)) {
  require("dotenv").config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  require("dotenv").config({ path: rootEnvPath });
} else {
  require("dotenv").config();
}

// Never fall back to a predictable literal JWT secret
const resolvedJwtSecret =
  process.env.JWT_SECRET ||
  (() => {
    console.warn("[Config Warning] JWT_SECRET missing in environment. Generating ephemeral runtime secret.");
    return crypto.randomBytes(48).toString("hex");
  })();

const config = {
  PORT: parseInt(process.env.PORT, 10) || 2000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database Configuration
  MONGO_URI: process.env.MONGO_URI,

  // JWT Authentication
  JWT_SECRET: resolvedJwtSecret,
  JWT_EXPIRES: process.env.JWT_EXPIRES || "7d",

  // Razorpay Payment Gateway
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",

  // AI & LLM Service Gateways
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || "",
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || "",

  // CORS Allowed Origins
  ALLOWED_ORIGINS: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
  ]
};

if (!config.MONGO_URI) {
  console.warn("[Config Warning] MONGO_URI is missing from environment. Define MONGO_URI in Server/.env");
}

module.exports = config;
