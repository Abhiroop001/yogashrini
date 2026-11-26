const express = require("express");
const router = express.Router();
const pc = require("../controller/product_controller");
const { authenticate, optionalAuth, requireAdmin } = require("../middleware/auth");

// Public catalog
router.get("/sel",                 pc.selproduct);

// Admin stats & order management
router.get("/stats",               authenticate, requireAdmin, pc.productStats);
router.get("/orders",              authenticate, requireAdmin, pc.listOrders);
router.post("/order-status",       authenticate, requireAdmin, pc.updateOrderStatus);

// Public / Authenticated Checkout (COD + Razorpay)
router.post("/order",                optionalAuth, pc.orderProduct);
router.post("/create-payment-order", optionalAuth, pc.createProductPaymentOrder);
router.post("/verify-payment",       optionalAuth, pc.verifyProductPayment);

// Admin CRUD operations
router.post("/add",       authenticate, requireAdmin, pc.addproduct);
router.post("/edit",      authenticate, requireAdmin, pc.editproduct);
router.post("/upd",       authenticate, requireAdmin, pc.updproduct);
router.put("/:id",        authenticate, requireAdmin, pc.updproduct);
router.post("/del",       authenticate, requireAdmin, pc.delproduct);
router.delete("/:id",     authenticate, requireAdmin, pc.delproduct);
router.get("/:id",        pc.editproduct);

module.exports = router;
