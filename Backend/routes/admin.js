// Server/routes/admin.js
const express = require("express");
const router = express.Router();
const ac = require("../controller/admin_controller");
const { authenticate, optionalAuth, requireAdmin } = require("../middleware/auth");

router.get("/add", optionalAuth, ac.addadmin);
router.post("/login", ac.login);
router.get("/verify", authenticate, requireAdmin, ac.verify);

module.exports = router;
