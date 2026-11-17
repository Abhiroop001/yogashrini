import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MdEmail, MdLock, MdLogin } from "react-icons/md";
import YogashriniLogo from "../inc/Yogashrini.jpg";

const API = "http://localhost:2000";

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const nav = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();

      if (data.name) {
        localStorage.setItem("uname", data.name);
        nav("/");
      } else {
        setErr(data.msg || data.error || "Invalid administrator credentials");
      }
    } catch {
      setErr("Network error. Ensure the server is online on port 2000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src={YogashriniLogo}
            alt="Yogashrini"
            style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", marginBottom: 12 }}
          />
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1e1e2e" }}>Yogashrini</div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>Executive Administration Portal</div>
        </div>

        {err && (
          <div className="ys-alert ys-alert-danger" style={{ marginBottom: 20 }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ys-form-group">
            <label className="ys-label d-flex align-items-center gap-1">
              <MdEmail /> Administrator Email
            </label>
            <input
              type="email"
              required
              className="ys-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yogashrini.com"
            />
          </div>

          <div className="ys-form-group" style={{ marginBottom: 24 }}>
            <label className="ys-label d-flex align-items-center gap-1">
              <MdLock /> Secure Password
            </label>
            <input
              type="password"
              required
              className="ys-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-ys"
            style={{ width: "100%", justifyContent: "center", padding: "12px" }}
          >
            <MdLogin /> {loading ? "Authenticating..." : "Sign In to Admin Console"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
