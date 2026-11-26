const User   = require("../db/userdb");
const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const config = require("../config");

function makeToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role || "student" },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES }
  );
}

module.exports = {

  // POST /user/register
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password)
        return res.status(400).json({ msg: "All fields are required." });

      if (String(password).length < 6)
        return res.status(400).json({ msg: "Password must be at least 6 characters." });

      const cleanEmail = String(email).toLowerCase().trim();
      const existing = await User.findOne({ email: cleanEmail });
      if (existing)
        return res.status(409).json({ msg: "An account with this email already exists." });

      const salt   = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(String(password), salt);

      const user = await User.create({
        name: String(name).trim(),
        email: cleanEmail,
        password: hashed,
      });
      const token = makeToken(user);

      return res.status(201).json({
        msg  : "Account created successfully!",
        token,
        user : { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  // POST /user/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return res.status(400).json({ msg: "Email and password are required." });

      const cleanEmail = String(email).toLowerCase().trim();
      const user = await User.findOne({ email: cleanEmail });
      if (!user)
        return res.status(401).json({ msg: "Invalid email or password." });

      const match = await bcrypt.compare(String(password), user.password);
      if (!match)
        return res.status(401).json({ msg: "Invalid email or password." });

      const token = makeToken(user);

      return res.status(200).json({
        msg  : "Login successful!",
        token,
        user : { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  // GET /user/me (protected via authenticate middleware)
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user)
        return res.status(404).json({ msg: "User not found." });

      return res.status(200).json({
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      return res.status(401).json({ msg: "Invalid or expired token." });
    }
  },
};
