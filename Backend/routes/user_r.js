const express = require("express");
const router  = express.Router();
const uc      = require("../controller/user_controller");
const { authenticate } = require("../middleware/auth");

router.post("/register", uc.register);
router.post("/login",    uc.login);
router.get("/me",        authenticate, uc.getMe);

module.exports = router;
