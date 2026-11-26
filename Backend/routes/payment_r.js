const express = require("express");
const router  = express.Router();
const p       = require("../controller/payment_controller");
const { authenticate, requireAdmin } = require("../middleware/auth");

// Authenticated student payment flows
router.post("/create-order", authenticate, p.createOrder);
router.post("/verify",       authenticate, p.verifyPayment);

// Authenticated enrollment queries
router.get("/enrollment/check/:courseId", authenticate, p.checkEnrollment);
router.get("/enrollment/my",              authenticate, p.myEnrollments);
router.post("/enrollment/complete-week",  authenticate, p.completeWeek);

// Admin revenue telemetry
router.get("/enrollment/stats",           authenticate, requireAdmin, p.enrollmentStats);

module.exports = router;
