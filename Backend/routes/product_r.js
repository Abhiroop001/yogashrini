const express = require("express");
const router = express.Router();
const pc = require("../controller/product_controller");

// Catalog & Product stats
router.get("/sel",        pc.selproduct);
router.get("/stats",      pc.productStats);

// Orders & Inquiries
router.get("/orders",        pc.listOrders);
router.post("/order",        pc.orderProduct);
router.post("/order-status", pc.updateOrderStatus);

// CRUD operations (both REST and legacy forms supported)
router.post("/add",       pc.addproduct);
router.post("/edit",      pc.editproduct);
router.get("/:id",        pc.editproduct);
router.post("/upd",       pc.updproduct);
router.put("/:id",        pc.updproduct);
router.post("/del",       pc.delproduct);
router.delete("/:id",     pc.delproduct);

module.exports = router;
