// Server/routes/ai_r.js
// Routes for AI Gateway, RAG Chatbot, Smart Reports, Biomechanics, and Admin Intelligence

const express = require("express");
const router = express.Router();
const aiController = require("../controller/ai_controller");

// RAG Chatbot
router.post("/chat", aiController.chatWithRAG);

// Smart Report Generation
router.post("/generate-report", aiController.generateSmartReport);

// Smart Biomechanical Posture Analysis
router.post("/smart-analysis", aiController.smartBiomechanicsAnalysis);

// Admin Executive Intelligence Briefing
router.get("/admin-executive-briefing", aiController.getAdminExecutiveBriefing);

// Personalized Yoga Routine Generator
router.post("/generate-routine", aiController.generateRoutine);

// Contraindication & Safety Scanner
router.post("/contraindication-check", aiController.checkContraindications);

module.exports = router;
