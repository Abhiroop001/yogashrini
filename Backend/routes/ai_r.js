// Server/routes/ai_r.js
// Routes for AI Gateway, RAG Chatbot, Smart Reports, Biomechanics, and Admin Intelligence

const express = require("express");
const router = express.Router();
const aiController = require("../controller/ai_controller");
const { authenticate, requireAdmin } = require("../middleware/auth");

// RAG Chatbot
router.post("/chat", aiController.chatWithRAG);

// Smart Report Generation
router.post("/generate-report", aiController.generateSmartReport);

// Smart Biomechanical Posture Analysis
router.post("/smart-analysis", aiController.smartBiomechanicsAnalysis);

// Admin Executive Intelligence Briefing (Protected)
router.get("/admin-executive-briefing", authenticate, requireAdmin, aiController.getAdminExecutiveBriefing);

// Personalized Yoga Routine Generator
router.post("/generate-routine", aiController.generateRoutine);

// Daily Routine Tracker (Weight/Height/Goal-Driven Diet + Asanas + Images)
router.post("/daily-routine-tracker", aiController.generateDailyRoutineTracker);

// Asana Image Resolver / Hugging Face Image Endpoint
router.get("/asana-image", aiController.getAsanaImage);
router.post("/asana-image", aiController.getAsanaImage);

// Contraindication & Safety Scanner
router.post("/contraindication-check", aiController.checkContraindications);

module.exports = router;
