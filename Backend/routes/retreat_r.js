const exp = require("express");
const router = exp.Router();

const rc = require("../controller/retreat_controller");

router.post("/add", rc.addretreat);

router.get("/sel", rc.selretreat);

router.post("/del", rc.delretreat);

router.post("/edit", rc.editretreat);

router.post("/upd", rc.updretreat);

module.exports = router;
