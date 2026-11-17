const express = require("express");
const router  = express.Router();
const uc      = require("../controller/user_controller");

router.post("/register", uc.register);
router.post("/login",    uc.login);
router.get("/me",        uc.getMe);

module.exports = router;
