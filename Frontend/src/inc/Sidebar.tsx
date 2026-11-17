// src/inc/Sidebar.tsx
import React, { useState } from "react";
import "./Sidebar.css";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdChevronLeft,
  MdChevronRight,
  MdHome,
  MdSelfImprovement,
  MdCalendarMonth,
  MdFlightTakeoff,
  MdSchool,
  MdPhone
} from "react-icons/md";

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const location = useLocation();

  const toggleSidebar = () => setIsCollapsed(prev => !prev);

  const navItems = [
    { to: "/", label: "Home", icon: MdHome },
    { to: "/about", label: "About", icon: MdSelfImprovement },
    { to: "/classes", label: "Classes", icon: MdCalendarMonth },
    { to: "/retreat", label: "Retreats", icon: MdFlightTakeoff },
    { to: "/training", label: "Training", icon: MdSchool },
    { to: "/contact", label: "Contact", icon: MdPhone }
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
    >
      <button
        className="collapse-button"
        onClick={toggleSidebar}
        aria-label="Toggle Navigation Sidebar"
      >
        {isCollapsed ? <MdChevronRight size={18} /> : <MdChevronLeft size={18} />}
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="sidebar-title">Yogashrini</h2>
            <ul className="sidebar-nav">
              {navItems.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "var(--yoga-primary, #FF2D6F)" : "inherit"
                      }}
                    >
                      <Icon size={18} /> {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};

export default Sidebar;
