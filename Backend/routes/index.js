// Server/routes/index.js
// Master Router Aggregator for Yogashrini Platform
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const path = require("path");
const fileUpload = require("express-fileupload");

// Upload middleware configuration
const uploadMiddleware = fileUpload({
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  useTempFiles: false
});

// Import sub-routers
const userRouter = require("./user_r");
const courseRouter = require("./course_r");
const productRouter = require("./product_r");
const retreatRouter = require("./retreat_r");
const paymentRouter = require("./payment_r");
const adminRouter = require("./admin");
const aiRouter = require("./ai_r");
const ragService = require("../services/rag_service");

// ── Liveness & System Health Check ──────────────────────────────────────────
router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  res.json({
    status: dbState === 1 ? "healthy" : "degraded",
    service: "Yogashrini Backend Platform",
    uptime: Math.floor(process.uptime()) + "s",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStateMap[dbState] || "unknown",
      name: mongoose.connection.name || "none"
    },
    memory: {
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    }
  });
});

// ── Root Health Alias ───────────────────────────────────────────────────────
router.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Yogashrini Server",
    version: "2.0.0",
    timestamp: new Date().toISOString()
  });
});

// ── Core Domain Routers ─────────────────────────────────────────────────────
router.use("/user", userRouter);
router.use("/course", uploadMiddleware, courseRouter);
router.use("/product", uploadMiddleware, productRouter);
router.use("/retreat", uploadMiddleware, retreatRouter);
router.use("/payment", paymentRouter);
router.use("/admin", adminRouter);
router.use("/ai", aiRouter);

// ── Root /chat Endpoint (Direct Compatibility with Legacy & AI Clients) ────
router.post("/chat", async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "No message provided or message is invalid." });
    }

    const apiBase = `${req.protocol}://${req.get("host")}`;
    const result = await ragService.queryWithRAG(message, Array.isArray(history) ? history : [], apiBase);
    return res.json({
      choices: [
        {
          message: {
            content: result.reply
          }
        }
      ],
      sources: result.sources,
      images: result.images || [],
      engine: {
        model: result.model,
        provider: result.provider
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
