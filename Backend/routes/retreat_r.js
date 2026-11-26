// Server/routes/retreat_r.js
const express = require("express");
const router = express.Router();
const rc = require("../controller/retreat_controller");
const { authenticate, optionalAuth, requireAdmin } = require("../middleware/auth");

// Specific routes MUST precede parameterized /:id routes
router.get("/sel",                   rc.selretreat);
router.get("/bookings",              authenticate, requireAdmin, rc.listBookings);

// Booking & Razorpay Reservation Flows
router.post("/book",                 optionalAuth, rc.bookRetreat);
router.post("/create-payment-order", optionalAuth, rc.createRetreatPaymentOrder);
router.post("/verify-payment",       optionalAuth, rc.verifyRetreatPayment);

// Admin CRUD Operations
router.post("/add",   authenticate, requireAdmin, rc.addretreat);
router.post("/del",   authenticate, requireAdmin, rc.delretreat);
router.post("/edit",  authenticate, requireAdmin, rc.editretreat);
router.post("/upd",   authenticate, requireAdmin, rc.updretreat);

// RESTful Endpoints
router.get("/",       rc.selretreat);
router.post("/",      authenticate, requireAdmin, rc.addretreat);
router.get("/:id",    rc.editretreat);
router.put("/:id",    authenticate, requireAdmin, rc.updretreat);
router.delete("/:id", authenticate, requireAdmin, rc.delretreat);

module.exports = router;
