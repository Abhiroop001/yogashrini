// server.js - Yogashrini Platform Backend
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");

const app = express();
const PORT = process.env.PORT || 2000;

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://abhiroopm001:abhiroop1234@cluster0.zwluqem.mongodb.net/mern56?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch(err => console.error("Mongo connection error:", err));

// Allowed origins - matches any localhost or 127.0.0.1 port in dev
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS policy: This origin is not allowed - " + origin), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Parse JSON / urlencoded payloads
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true }));

// Static directories
app.use(express.static(path.join(__dirname, "public")));
app.use("/product_img", express.static(path.join(__dirname, "public/product_img")));
app.use("/thumbnails", express.static(path.join(__dirname, "public/thumbnails")));
app.use("/videos", express.static(path.join(__dirname, "public/videos")));

const uploadMiddleware = fileUpload({ limits: { fileSize: 200 * 1024 * 1024 }, useTempFiles: false });

// Routes that need file upload / multipart form parsing
const pr = require("./routes/product_r");
app.use("/product", uploadMiddleware, pr);

const ar = require("./routes/admin");
app.use("/admin", ar);

const rr = require("./routes/retreat_r");
app.use("/retreat", uploadMiddleware, rr);

const cr = require("./routes/course_r");
app.use("/course", uploadMiddleware, cr);

// Routes that do NOT need file upload (plain JSON)
const pmr = require("./routes/payment_r");
app.use("/payment", pmr);

const ur = require("./routes/user_r");
app.use("/user", ur);

// AI Services & RAG Endpoints
const air = require("./routes/ai_r");
app.use("/ai", air);

const ragService = require("./services/rag_service");

// Health Check Root
app.get("/", (req, res) => res.json({ status: "online", service: "Yogashrini Server", timestamp: new Date().toISOString() }));

// --- Chatbot Endpoint (Upgraded with Domain-Specific RAG Engine) ---
app.post("/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  try {
    const result = await ragService.queryWithRAG(message, Array.isArray(history) ? history : []);
    return res.json({
      choices: [
        {
          message: {
            content: result.reply
          }
        }
      ],
      sources: result.sources,
      engine: {
        model: result.model,
        provider: result.provider
      }
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
