import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MdEmail, MdLock, MdLogin, MdVisibility, MdVisibilityOff } from "react-icons/md";
import YogashriniLogo from "../inc/Yogashrini.jpg";
import { API_BASE, getAdminToken, saveAdminSession } from "../utils/api";

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPwd, setShowPwd] = useState<boolean>(false);
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const nav = useNavigate();

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.ok) nav("/", { replace: true });
      })
      .catch(() => {});
  }, [nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();

      if (r.ok && data.token) {
        saveAdminSession(
          data.token,
          data.admin || { id: data.id, name: data.name || "Administrator", email, role: data.role || "admin" }
        );
        nav("/", { replace: true });
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
        transition={{ duration: 0.25 }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img
            src={YogashriniLogo}
            alt="Yogashrini"
            style={{ width: 60, height: 60, borderRadius: 14, objectFit: "cover", marginBottom: 10 }}
          />
          <div style={{ fontSize: 21, fontWeight: 800, color: "var(--text-primary)" }}>Yogashrini</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Executive Administration Portal</div>
        </div>

        {err && (
          <div className="ys-alert ys-alert-danger" style={{ marginBottom: 18 }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ys-form-group">
            <label htmlFor="admin-email" className="ys-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MdEmail /> Administrator Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="ys-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yogashrini.com"
            />
          </div>

          <div className="ys-form-group" style={{ marginBottom: 22 }}>
            <label htmlFor="admin-password" className="ys-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MdLock /> Secure Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="admin-password"
                name="password"
                type={showPwd ? "text" : "password"}
                required
                autoComplete="current-password"
                className="ys-input"
                style={{ paddingRight: 40 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
              <button
                type="button"
                aria-label={showPwd ? "Hide password" : "Show password"}
                onClick={() => setShowPwd((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                {showPwd ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
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
