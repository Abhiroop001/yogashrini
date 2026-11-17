const User   = require("../db/userdb");
const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const config = require("../config");

const JWT_SECRET  = config.JWT_SECRET;
const JWT_EXPIRES = config.JWT_EXPIRES;

// ── helpers ─────────────────────────────────────────────────────────────────
function makeToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

module.exports = {

  // POST /user/register
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password)
        return res.status(400).json({ msg: "All fields are required." });

      if (password.length < 6)
        return res.status(400).json({ msg: "Password must be at least 6 characters." });

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing)
        return res.status(409).json({ msg: "An account with this email already exists." });

      const salt   = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
      const token = makeToken(user);

      return res.status(201).json({
        msg  : "Account created successfully!",
        token,
        user : { id: user._id, name: user.name, email: user.email, role: user.role },
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

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user)
        return res.status(401).json({ msg: "Invalid email or password." });

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res.status(401).json({ msg: "Invalid email or password." });

      const token = makeToken(user);

      return res.status(200).json({
        msg  : "Login successful!",
        token,
        user : { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  // GET /user/me  (protected — pass Authorization: Bearer <token>)
  async getMe(req, res) {
    try {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith("Bearer "))
        return res.status(401).json({ msg: "No token provided." });

      const token   = auth.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user    = await User.findById(decoded.id).select("-password");
      if (!user)
        return res.status(404).json({ msg: "User not found." });

      return res.status(200).json({ user });
    } catch (err) {
      return res.status(401).json({ msg: "Invalid or expired token." });
    }
  },
};
