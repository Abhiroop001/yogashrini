// Server/routes/admin.js
const express = require("express");
const router = express.Router();
const ac = require("../controller/admin_controller");

// Admin seed and login routes
router.get("/add", ac.addadmin);
router.post("/login", ac.login);

module.exports = router;
