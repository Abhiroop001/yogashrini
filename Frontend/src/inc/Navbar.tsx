// src/inc/Navbar.tsx
// Fully Responsive Sticky Glassmorphic Navbar with Framer Motion Mobile Drawer
// Strictly Zero Emojis - react-icons Exclusive

import React, { useEffect, useState } from "react";
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
  MdPlayCircle,
  MdSchool,
  MdSelfImprovement,
  MdFitnessCenter
} from "react-icons/md";
import { useAuth } from "../AuthContext";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About Us" },
  { path: "/classes", label: "Classes" },
  { path: "/courses", label: "Courses" },
  { path: "/retreat", label: "Retreat" },
  { path: "/training", label: "Training" },
  { path: "/contact", label: "Contact Us" },
  { path: "/posture", label: "Posture AI" },
  { path: "/live-trainer", label: "Live Trainer", isLive: true },
  { path: "/types", label: "Asanas" },
];

const Navbar: React.FC = () => {
  const [theme, setTheme] = useState<string>("light");
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

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  return (
    <nav className="yoga-navbar-root">
      <div className="yoga-container navbar-inner">
        {/* Brand Logo & Name */}
        <NavLink className="brand-group" to="/">
          <img src={YogashriniLogo} alt="Yogashrini" className="brand-logo-img" />
          <span className="brand-name-text">Yogashrini</span>
        </NavLink>

        {/* Desktop Navigation Links */}
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

        {/* Desktop Right Actions (User + Theme) */}
        <div className="navbar-actions-group">
          {isAuthenticated && user && (
            <div className="user-profile-chip">
              <MdPerson className="user-icon" size={17} />
              <span className="user-display-name">{user.name}</span>
              <button
                className="user-logout-icon-btn"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <MdLogout size={16} />
              </button>
            </div>
          )}

          <button
            className="theme-mode-btn"
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <MdDarkMode size={20} /> : <MdLightMode size={20} />}
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <MdClose size={26} /> : <MdMenu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay and Navigation Sheet */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              className="mobile-drawer-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
            >
              <div className="mobile-drawer-header">
                <div className="d-flex align-items-center gap-2">
                  <img src={YogashriniLogo} alt="Yogashrini" className="drawer-logo" />
                  <span className="drawer-brand-title">Yogashrini</span>
                </div>
                <button
                  className="drawer-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <MdClose size={24} />
                </button>
              </div>

              {isAuthenticated && user && (
                <div className="drawer-user-card">
                  <div className="d-flex align-items-center gap-2">
                    <div className="drawer-user-avatar">
                      <MdPerson size={20} />
                    </div>
                    <div>
                      <div className="drawer-user-name">{user.name}</div>
                      <div className="drawer-user-role">{user.role || "Practitioner"}</div>
                    </div>
                  </div>
                  <button className="drawer-logout-btn" onClick={handleLogout}>
                    <MdLogout size={16} /> Sign Out
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
                <button className="drawer-theme-toggle-btn" onClick={toggleTheme}>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
