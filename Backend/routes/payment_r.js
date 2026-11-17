const express = require("express");
const router  = express.Router();
const p       = require("../controller/payment_controller");

// Razorpay payment flow
router.post("/create-order", p.createOrder);
router.post("/verify",       p.verifyPayment);

// Enrollment queries
router.get("/enrollment/check/:courseId", p.checkEnrollment);
router.get("/enrollment/my",              p.myEnrollments);
router.post("/enrollment/complete-week",  p.completeWeek);
router.get("/enrollment/stats",           p.enrollmentStats);

module.exports = router;
