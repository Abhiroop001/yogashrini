var Retreat = require("../db/retreatdb");

module.exports = {
    async addretreat(req, res) {
        try {
            var ins = {
                rname: req.body.rname,
                rdate: req.body.rdate,
                rlocation: req.body.rlocation,
                ractivities: req.body.ractivities,
                rcost: req.body.rcost
            };

            await Retreat.create(ins);
            res.json({ msg: "Retreat Added" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async selretreat(req, res) {
        try {
            var data = await Retreat.find();
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async delretreat(req, res) {
        try {
            var id = req.body.id;
            await Retreat.findByIdAndDelete(id);
            res.json({ msg: "Retreat Deleted" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async editretreat(req, res) {
        try {
            var id = req.body.id;
            var data = await Retreat.findById(id);
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async updretreat(req, res) {
        try {
            var id = req.body.id;

            var ins = {
                rname: req.body.rname,
                rdate: req.body.rdate,
                rlocation: req.body.rlocation,
                ractivities: req.body.ractivities,
                rcost: req.body.rcost
            };

            await Retreat.findByIdAndUpdate(id, ins);
            res.json({ msg: "Retreat Updated" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
