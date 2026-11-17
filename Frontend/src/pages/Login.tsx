import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
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
    setToast(null);
  };

  return (
    <>
      <Navbar />

      <main className="login-page py-5">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`login-toast ${toast.type === "ok" ? "toast-ok" : "toast-err"}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {toast.type === "ok" ? <MdCheckCircle size={18} /> : <MdErrorOutline size={18} />}
              <span>{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="login-card shadow-lg rounded-4 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="login-card-header text-center p-4">
            <GiLotus size={52} className="login-lotus mb-2" style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
            <h2 className="login-title fw-bold text-dark mb-1">
              {mode === "login" ? "Welcome Back" : "Join Yogashrini"}
            </h2>
            <p className="login-subtitle text-muted small mb-0">
              {mode === "login"
                ? "Sign in to access your movement intelligence dashboard."
                : "Create an account to begin your personal yoga practice."}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="login-tabs d-flex border-bottom" role="tablist">
            <button
              type="button"
              role="tab"
              className={`login-tab flex-grow-1 py-3 text-center border-0 bg-transparent fw-bold ${
                mode === "login" ? "active border-bottom border-3 border-primary text-primary" : "text-muted"
              }`}
              onClick={() => mode !== "login" && switchMode()}
            >
              <MdLogin className="me-1" size={18} /> Sign In
            </button>
            <button
              type="button"
              role="tab"
              className={`login-tab flex-grow-1 py-3 text-center border-0 bg-transparent fw-bold ${
                mode === "register" ? "active border-bottom border-3 border-primary text-primary" : "text-muted"
              }`}
              onClick={() => mode !== "register" && switchMode()}
            >
              <MdPersonAdd className="me-1" size={18} /> Register
            </button>
          </div>

          {/* Form */}
          <form className="login-form p-4" onSubmit={handleSubmit} noValidate>
            {mode === "register" && (
              <div className="mb-3">
                <label className="form-label small fw-bold d-flex align-items-center gap-1" htmlFor="lf-name">
                  <MdPerson size={16} /> Full Name
                </label>
                <input
                  id="lf-name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={field}
                  className={`form-control rounded-3 ${errors.name ? "is-invalid" : ""}`}
                  autoComplete="name"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-bold d-flex align-items-center gap-1" htmlFor="lf-email">
                <MdEmail size={16} /> Email Address
              </label>
              <input
                id="lf-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={field}
                className={`form-control rounded-3 ${errors.email ? "is-invalid" : ""}`}
                autoComplete="email"
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold d-flex align-items-center gap-1" htmlFor="lf-password">
                <MdLock size={16} /> Password
              </label>
              <div className="input-group">
                <input
                  id="lf-password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={field}
                  className={`form-control rounded-start-3 ${errors.password ? "is-invalid" : ""}`}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPwd(!showPwd)}
                >
                  {showPwd ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
            </div>

            {mode === "register" && (
              <div className="mb-4">
                <label className="form-label small fw-bold d-flex align-items-center gap-1" htmlFor="lf-confirm">
                  <MdLock size={16} /> Confirm Password
                </label>
                <input
                  id="lf-confirm"
                  name="confirm"
                  type={showPwd ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={form.confirm}
                  onChange={field}
                  className={`form-control rounded-3 ${errors.confirm ? "is-invalid" : ""}`}
                  autoComplete="new-password"
                />
                {errors.confirm && <div className="invalid-feedback">{errors.confirm}</div>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" /> Processing...
                </>
              ) : mode === "login" ? (
                <>
                  <MdLogin /> Sign In
                </>
              ) : (
                <>
                  <MdPersonAdd /> Complete Registration
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>
      <Footer />
    </>
  );
};

export default Login;
