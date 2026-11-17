// Server/controller/retreat_controller.js
const Retreat = require("../db/retreatdb");
const mongoose = require("mongoose");

module.exports = {
  // POST /retreat/add or POST /retreat
  async addretreat(req, res) {
    try {
      const { rname, rdate, rlocation, ractivities, rcost } = req.body;
      if (!rname) {
        return res.status(400).json({ error: "Retreat name (rname) is required" });
      }

      const retreat = await Retreat.create({
        rname,
        rdate: rdate || "",
        rlocation: rlocation || "",
        ractivities: ractivities || "",
        rcost: rcost || ""
      });

      res.status(201).json({ msg: "Retreat Added", retreat });
    } catch (err) {
      console.error("[Retreat Controller] Add error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET /retreat/sel or GET /retreat
  async selretreat(req, res) {
    try {
      const data = await Retreat.find().sort({ _id: -1 });
      res.json(data);
    } catch (err) {
      console.error("[Retreat Controller] List error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // POST /retreat/del or DELETE /retreat/:id
  async delretreat(req, res) {
    try {
      const id = req.params.id || req.body.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid retreat ID" });
      }

      const deleted = await Retreat.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Retreat not found" });
      }

      res.json({ msg: "Retreat Deleted", id });
    } catch (err) {
      console.error("[Retreat Controller] Delete error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // POST /retreat/edit or GET /retreat/:id
  async editretreat(req, res) {
    try {
      const id = req.params.id || req.body.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid retreat ID" });
      }

      const data = await Retreat.findById(id);
      if (!data) {
        return res.status(404).json({ error: "Retreat not found" });
      }

      res.json(data);
    } catch (err) {
      console.error("[Retreat Controller] Get error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // POST /retreat/upd or PUT /retreat/:id
  async updretreat(req, res) {
    try {
      const id = req.params.id || req.body.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid retreat ID" });
      }

      const { rname, rdate, rlocation, ractivities, rcost } = req.body;
      const updates = { rname, rdate, rlocation, ractivities, rcost };

      const updated = await Retreat.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) {
        return res.status(404).json({ error: "Retreat not found" });
      }

      res.json({ msg: "Retreat Updated", retreat: updated });
    } catch (err) {
      console.error("[Retreat Controller] Update error:", err);
      res.status(500).json({ error: err.message });
    }
  }
};
