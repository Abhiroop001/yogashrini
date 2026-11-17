// Server/controller/admin_controller.js
const Admin = require("../db/admindb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = {
  // GET /admin/add (Seed or Initialize Admin)
  async addadmin(req, res) {
    try {
      const email = (process.env.ADMIN_EMAIL || "jack@gmail.com").toLowerCase();
      const existing = await Admin.findOne({ email });
      if (existing) {
        return res.json({ msg: "Admin account already exists", email });
      }

      const passwordPlain = process.env.ADMIN_PASSWORD || "123456";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(passwordPlain, salt);

      const newAdmin = await Admin.create({
        name: process.env.ADMIN_NAME || "Jack",
        email,
        password: hashedPassword
      });

      return res.status(201).json({ msg: "Admin created successfully", id: newAdmin._id });
    } catch (err) {
      console.error("[Admin Controller] Seed error:", err);
      return res.status(500).json({ error: "Failed to initialize admin account" });
    }
  },

  // POST /admin/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ msg: "Email and password are required" });
      }

      const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
      if (!admin) {
        return res.status(401).json({ msg: "Invalid administrator credentials" });
      }

      if (!admin.password) {
        return res.status(500).json({ msg: "Admin account has no password set. Visit /admin/add to seed." });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ msg: "Invalid administrator credentials" });
      }

      // Issue signed JWT token with admin role
      const token = jwt.sign(
        { id: admin._id, name: admin.name, email: admin.email, role: "admin" },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES }
      );

      return res.json({
        msg: "Admin login successful",
        token,
        name: admin.name,
        id: admin._id,
        role: "admin"
      });
    } catch (err) {
      console.error("[Admin Controller] Login error:", err);
      return res.status(500).json({ msg: "Server error during administrator authentication" });
    }
  }
};
