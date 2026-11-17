// Server/routes/retreat_r.js
const express = require("express");
const router = express.Router();
const rc = require("../controller/retreat_controller");

// Specific routes MUST precede parameterized /:id routes
router.get("/sel", rc.selretreat);
router.post("/add", rc.addretreat);
router.post("/del", rc.delretreat);
router.post("/edit", rc.editretreat);
router.post("/upd", rc.updretreat);

// RESTful Endpoints
router.get("/", rc.selretreat);
router.post("/", rc.addretreat);
router.get("/:id", rc.editretreat);
router.put("/:id", rc.updretreat);
router.delete("/:id", rc.delretreat);

module.exports = router;
