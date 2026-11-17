// Server/index.js - Yogashrini Platform Backend
// Enterprise-Grade Modular Architecture with Graceful Shutdown & Strict Secret Isolation

const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const connectDB = require("./config/db");
const securityHeaders = require("./middleware/security");
const requestLogger = require("./middleware/logger");
const { notFoundHandler, globalErrorHandler } = require("./middleware/errorHandler");
const apiRouter = require("./routes");

const app = express();

// ── Security & Core Middleware ──────────────────────────────────────────────
app.use(securityHeaders);
app.use(requestLogger);

// ── CORS Configuration ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed =
        config.ALLOWED_ORIGINS.indexOf(origin) !== -1 ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS policy violation: origin not permitted (" + origin + ")"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// ── Payload Parsers ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// ── Static Asset Directories ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));
app.use("/product_img", express.static(path.join(__dirname, "public/product_img")));
app.use("/thumbnails", express.static(path.join(__dirname, "public/thumbnails")));
app.use("/videos", express.static(path.join(__dirname, "public/videos")));

// ── Master API Routing ──────────────────────────────────────────────────────
app.use("/", apiRouter);

// ── 404 & Error Handling ────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Server Bootstrap & Database Connection ──────────────────────────────────
let serverInstance;

async function startServer() {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Start HTTP listener
    serverInstance = app.listen(config.PORT, () => {
      console.log(`========================================================`);
      console.log(`  Yogashrini Platform Backend Server v2.0.0            `);
      console.log(`  Mode:     ${config.NODE_ENV.toUpperCase()}           `);
      console.log(`  Endpoint: http://localhost:${config.PORT}            `);
      console.log(`  Health:   http://localhost:${config.PORT}/health     `);
      console.log(`========================================================`);
    });
  } catch (err) {
    console.error("[Fatal Error] Server bootstrap aborted:", err.message);
    process.exit(1);
  }
}

// ── Graceful Process Teardown ───────────────────────────────────────────────
function handleShutdown(signal) {
  console.log(`\n[Shutdown] Received ${signal}. Closing server connections...`);
  if (serverInstance) {
    serverInstance.close(() => {
      console.log("[Shutdown] HTTP server closed successfully.");
      const mongoose = require("mongoose");
      mongoose.connection.close(false).then(() => {
        console.log("[Shutdown] MongoDB connection closed.");
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

startServer();

module.exports = app;
