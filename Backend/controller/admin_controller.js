// Server/controller/admin_controller.js
const Admin = require("../db/admindb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = {
  // GET /admin/add (Initial bootstrap only, or admin-authorized provisioning)
  async addadmin(req, res) {
    try {
      const adminCount = await Admin.countDocuments();
      // Once an administrator exists, require authenticated admin role to provision another
      if (adminCount > 0 && (!req.user || req.user.role !== "admin")) {
        return res.status(403).json({ error: "Forbidden: Administrator authentication required to create additional admins." });
      }

      const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
      const passwordPlain = process.env.ADMIN_PASSWORD || "";
      const name = process.env.ADMIN_NAME || "Administrator";

      if (!email || !passwordPlain) {
        return res.status(400).json({
          error: "ADMIN_EMAIL and ADMIN_PASSWORD must be configured in Server/.env before provisioning an admin."
        });
      }

      const existing = await Admin.findOne({ email });
      if (existing) {
        return res.json({ msg: "Admin account already exists", email });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(passwordPlain, salt);

      const newAdmin = await Admin.create({
        name,
        email,
        password: hashedPassword,
        role: "admin"
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

      const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() });
      if (!admin) {
        return res.status(401).json({ msg: "Invalid administrator credentials" });
      }

      if (!admin.password) {
        return res.status(500).json({ msg: "Admin account has no password set." });
      }

      const isMatch = await bcrypt.compare(String(password), admin.password);
      if (!isMatch) {
        return res.status(401).json({ msg: "Invalid administrator credentials" });
      }

      const token = jwt.sign(
        { id: admin._id, name: admin.name, email: admin.email, role: "admin" },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES }
      );

      return res.json({
        msg: "Admin login successful",
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: "admin"
        },
        // Legacy convenience fields
        name: admin.name,
        id: admin._id,
        role: "admin"
      });
    } catch (err) {
      console.error("[Admin Controller] Login error:", err);
      return res.status(500).json({ msg: "Server error during administrator authentication" });
    }
  },

  // GET /admin/verify (Protected via authenticate + requireAdmin)
  async verify(req, res) {
    try {
      const admin = await Admin.findById(req.user.id).select("-password");
      if (!admin) {
        return res.status(404).json({ authenticated: false, msg: "Administrator account not found" });
      }
      return res.json({
        authenticated: true,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role || "admin"
        }
      });
    } catch (err) {
      console.error("[Admin Controller] Verify error:", err);
      return res.status(500).json({ authenticated: false, msg: "Failed to verify session" });
    }
  }
};
