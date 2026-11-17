import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../AuthContext";
import { GiLotus } from "react-icons/gi";
import {
  MdEmail,
  MdLock,
  MdPerson,
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

export const Signup: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

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
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Min 6 characters required.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast("err", data.msg || "Registration failed.");
        return;
      }

      login(data.token, data.user);
      showToast("ok", "Account created successfully! Redirecting...");
      setTimeout(() => navigate("/"), 1200);
    } catch {
      showToast("err", "Cannot connect to server. Ensure backend is running on port 2000.");
    } finally {
      setLoading(false);
    }
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
          <h2 className="fs-4 fw-bold mb-1">Create an Account</h2>
          <p className="text-secondary small m-0">
            Join Yogashrini to access posture analysis, courses, and wellness metrics.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="login-form-body">
          <div className="login-input-group">
            <MdPerson className="login-input-icon" size={18} />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="login-input"
              value={form.name}
              onChange={field}
              autoComplete="name"
            />
            {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
          </div>

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
              autoComplete="new-password"
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

          <div className="login-input-group">
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
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`alert ${
                  toast.type === "ok" ? "alert-success" : "alert-danger"
                } py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3`}
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
              "Creating Account..."
            ) : (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <MdPersonAdd size={18} /> Register Account
              </span>
            )}
          </button>

          <div className="text-center mt-3 small text-secondary">
            Already have an account?{" "}
            <NavLink to="/login" className="text-decoration-none fw-bold" style={{ color: "var(--brand-primary)" }}>
              Sign In
            </NavLink>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Signup;
