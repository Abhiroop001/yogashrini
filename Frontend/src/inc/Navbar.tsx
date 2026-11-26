// Frontend/src/inc/Navbar.tsx
// Compact Single-Line Sticky Glassmorphic Navbar with Portal-Rendered Mobile Drawer
// Strictly Zero Emojis - react-icons & Framer Motion

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import YogashriniLogo from "../pages/Yogashrini.jpg";
import "./Navbar.css";
import {
  MdDarkMode,
  MdLightMode,
  MdLogout,
  MdPerson,
  MdMenu,
  MdClose,
} from "react-icons/md";
import { useAuth } from "../AuthContext";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/classes", label: "Classes" },
  { path: "/courses", label: "Courses" },
  { path: "/retreat", label: "Retreats" },
  { path: "/training", label: "Store" },
  { path: "/posture", label: "Posture AI" },
  { path: "/live-trainer", label: "Live Trainer", isLive: true },
  { path: "/types", label: "Asanas" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
];

const Navbar: React.FC = () => {
  const [theme, setTheme] = useState<string>("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-bs-theme", savedTheme);
    document.body.setAttribute("data-theme", savedTheme);
    document.body.setAttribute("data-bs-theme", savedTheme);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    document.documentElement.setAttribute("data-bs-theme", newTheme);
    document.body.setAttribute("data-theme", newTheme);
    document.body.setAttribute("data-bs-theme", newTheme);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  // Portal prevents ancestor backdrop-filter on <nav> from clipping fixed 100dvh drawer
  const mobileDrawerPortal =
    typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <motion.div
                  key="nav-backdrop"
                  className="mobile-drawer-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setMobileMenuOpen(false)}
                />

                <motion.aside
                  key="nav-drawer"
                  className="mobile-drawer-panel"
                  aria-label="Mobile navigation"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 280 }}
                >
                  <div className="mobile-drawer-header">
                    <div className="d-flex align-items-center gap-2">
                      <img src={YogashriniLogo} alt="Yogashrini" className="drawer-logo" />
                      <span className="drawer-brand-title">Yogashrini</span>
                    </div>
                    <button
                      type="button"
                      className="drawer-close-btn"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Close navigation menu"
                    >
                      <MdClose size={24} />
                    </button>
                  </div>

                  {isAuthenticated && user && (
                    <div className="drawer-user-card">
                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <div className="drawer-user-avatar flex-shrink-0">
                          <MdPerson size={20} />
                        </div>
                        <div className="overflow-hidden">
                          <div className="drawer-user-name text-truncate">{user.name}</div>
                          <div className="drawer-user-role text-capitalize">{user.role || "Practitioner"}</div>
                        </div>
                      </div>
                      <button type="button" className="drawer-logout-btn flex-shrink-0" onClick={handleLogout}>
                        <MdLogout size={15} /> Sign Out
                      </button>
                    </div>
                  )}

                  <ul className="mobile-nav-list">
                    {navItems.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `mobile-nav-item ${isActive ? "active" : ""} ${
                              item.isLive ? "live" : ""
                            }`
                          }
                        >
                          {item.isLive && <span className="live-dot-pulse" />}
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                    {!isAuthenticated && (
                      <li>
                        <NavLink
                          to="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `mobile-nav-item auth-btn ${isActive ? "active" : ""}`
                          }
                        >
                          Sign In / Register
                        </NavLink>
                      </li>
                    )}
                  </ul>

                  <div className="mobile-drawer-footer">
                    <button type="button" className="drawer-theme-toggle-btn" onClick={toggleTheme}>
                      {theme === "light" ? (
                        <>
                          <MdDarkMode size={18} />
                          <span>Switch to Dark Mode</span>
                        </>
                      ) : (
                        <>
                          <MdLightMode size={18} />
                          <span>Switch to Light Mode</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <>
      <nav className="yoga-navbar-root">
        <div className="yoga-container navbar-inner">
          {/* Brand Logo & Name */}
          <NavLink className="brand-group" to="/">
            <img src={YogashriniLogo} alt="Yogashrini" className="brand-logo-img" />
            <span className="brand-name-text">Yogashrini</span>
          </NavLink>

          {/* Compact Single-Line Desktop Navigation Links */}
          <ul className="desktop-nav-links">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link-anchor ${isActive ? "active-link" : ""} ${
                      item.isLive ? "live-trainer-link" : ""
                    }`
                  }
                >
                  {item.isLive && <span className="live-dot-pulse" />}
                  {item.label}
                </NavLink>
              </li>
            ))}
            {!isAuthenticated && (
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `nav-link-anchor ${isActive ? "active-link" : ""}`
                  }
                >
                  Sign In
                </NavLink>
              </li>
            )}
          </ul>

          {/* Desktop Right Actions (User + Theme + Hamburger) */}
          <div className="navbar-actions-group">
            {isAuthenticated && user && (
              <div className="user-profile-chip" title={user.name}>
                <MdPerson className="user-icon" size={16} />
                <span className="user-display-name">{user.name}</span>
                <button
                  type="button"
                  className="user-logout-icon-btn"
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <MdLogout size={15} />
                </button>
              </div>
            )}

            <button
              type="button"
              className="theme-mode-btn"
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <MdDarkMode size={18} /> : <MdLightMode size={18} />}
            </button>

            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>
      {mobileDrawerPortal}
    </>
  );
};

export default Navbar;
