import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
import { useAuth } from "../AuthContext";
import { GiLotus } from "react-icons/gi";
import { MdEmail, MdLock, MdPerson, MdPersonAdd, MdCheckCircle, MdErrorOutline } from "react-icons/md";
import "./Login.css";

const API = "http://localhost:2000";

export const Signup: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

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
    else if (form.password.length < 6) e.password = "Min 6 characters.";
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
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("err", data.msg || "Registration failed.");
        return;
      }
      login(data.token, data.user);
      showToast("ok", "Account created successfully!");
      setTimeout(() => navigate("/"), 1200);
    } catch {
      showToast("err", "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="login-page py-5">
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
          <div className="login-card-header text-center p-4">
            <GiLotus size={52} className="login-lotus mb-2" style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
            <h2 className="login-title fw-bold text-dark mb-1">Join Yogashrini</h2>
            <p className="login-subtitle text-muted small mb-0">
              Create an account to begin your personal yoga practice.
            </p>
          </div>

          <form className="login-form p-4" onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label small fw-bold d-flex align-items-center gap-1" htmlFor="signup-name">
                <MdPerson size={16} /> Full Name
              </label>
              <input
                id="signup-name"
                name="name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={field}
                className={`form-control rounded-3 ${errors.name ? "is-invalid" : ""}`}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold d-flex align-items-center gap-1" htmlFor="signup-email">
                <MdEmail size={16} /> Email Address
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={field}
                className={`form-control rounded-3 ${errors.email ? "is-invalid" : ""}`}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold d-flex align-items-center gap-1" htmlFor="signup-password">
                <MdLock size={16} /> Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={field}
                className={`form-control rounded-3 ${errors.password ? "is-invalid" : ""}`}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold d-flex align-items-center gap-1" htmlFor="signup-confirm">
                <MdLock size={16} /> Confirm Password
              </label>
              <input
                id="signup-confirm"
                name="confirm"
                type="password"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={field}
                className={`form-control rounded-3 ${errors.confirm ? "is-invalid" : ""}`}
              />
              {errors.confirm && <div className="invalid-feedback">{errors.confirm}</div>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              <MdPersonAdd /> {loading ? "Creating Account..." : "Register Account"}
            </button>

            <div className="text-center mt-3 small text-muted">
              Already have an account? <NavLink to="/login" className="text-primary fw-bold text-decoration-none">Sign In</NavLink>
            </div>
          </form>
        </motion.div>
      </main>
      <Footer />
    </>
  );
};

export default Signup;
