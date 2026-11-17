// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../AuthContext";
import { GiLotus } from "react-icons/gi";
import {
  MdEmail,
  MdLock,
  MdPerson,
  MdLogin,
  MdPersonAdd,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdErrorOutline,
} from "react-icons/md";
import "./Login.css";

const API = "http://localhost:2000";

interface ToastState {
  type: "ok" | "err";
  msg: string;
}

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPwd, setShowPwd] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const field = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "register" && !form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Min 6 characters required.";
    if (mode === "register" && form.password !== form.confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const endpoint = mode === "login" ? "/user/login" : "/user/register";
    const body =
      mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast("err", data.msg || "Authentication error occurred.");
        return;
      }

      login(data.token, data.user);
      showToast("ok", data.msg || (mode === "login" ? "Welcome back!" : "Account created successfully!"));
      setTimeout(() => navigate("/"), 1200);
    } catch {
      showToast("err", "Cannot connect to server. Make sure the backend is active on port 2000.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setErrors({});
    setForm({ name: "", email: "", password: "", confirm: "" });
  };

  return (
    <div className="login-page-wrapper">
      <motion.div
        className="login-card-container"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="login-card-header">
          <GiLotus size={48} style={{ color: "var(--brand-primary)" }} className="mb-2" />
          <h2 className="fs-4 fw-bold mb-1">
            {mode === "login" ? "Welcome to Yogashrini" : "Begin Your Journey"}
          </h2>
          <p className="text-secondary small m-0">
            {mode === "login"
              ? "Sign in to access your practice curriculum and dashboard."
              : "Register to track posture progress and unlock video modules."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => mode !== "login" && switchMode()}
          >
            <MdLogin size={16} /> Sign In
          </button>
          <button
            type="button"
            className={`login-tab-btn ${mode === "register" ? "active" : ""}`}
            onClick={() => mode !== "register" && switchMode()}
          >
            <MdPersonAdd size={16} /> Register
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="login-form-body">
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="login-input-group"
              >
                <MdPerson className="login-input-icon" size={18} />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className="login-input"
                  value={form.name}
                  onChange={field}
                />
                {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="login-input-group">
            <MdEmail className="login-input-icon" size={18} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="login-input"
              value={form.email}
              onChange={field}
              autoComplete="email"
            />
            {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
          </div>

          <div className="login-input-group">
            <MdLock className="login-input-icon" size={18} />
            <input
              type={showPwd ? "text" : "password"}
              name="password"
              placeholder="Password (min 6 characters)"
              className="login-input"
              value={form.password}
              onChange={field}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            <button
              type="button"
              className="login-pwd-toggle"
              onClick={() => setShowPwd(!showPwd)}
              tabIndex={-1}
            >
              {showPwd ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
            </button>
            {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
          </div>

          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div
                key="confirm-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="login-input-group"
              >
                <MdLock className="login-input-icon" size={18} />
                <input
                  type={showPwd ? "text" : "password"}
                  name="confirm"
                  placeholder="Confirm Password"
                  className="login-input"
                  value={form.confirm}
                  onChange={field}
                  autoComplete="new-password"
                />
                {errors.confirm && <div className="text-danger small mt-1">{errors.confirm}</div>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`alert ${toast.type === "ok" ? "alert-success" : "alert-danger"} py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3`}
              >
                {toast.type === "ok" ? <MdCheckCircle size={18} /> : <MdErrorOutline size={18} />}
                <span>{toast.msg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="btn btn-primary w-100 py-3 fw-bold mt-2"
            disabled={loading}
          >
            {loading ? (
              "Verifying..."
            ) : mode === "login" ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <MdLogin size={18} /> Sign In
              </span>
            ) : (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <MdPersonAdd size={18} /> Create Account
              </span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
