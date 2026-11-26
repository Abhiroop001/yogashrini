import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdVideoLibrary,
  MdAddCircleOutline,
  MdList,
  MdSpa,
  MdLocalActivity,
  MdLogout,
  MdSchool,
  MdClose,
} from "react-icons/md";
import { RiBookLine } from "react-icons/ri";
import YogashriniLogo from "./Yogashrini.jpg";
import { useAdminUI } from "../App";
import { clearAdminSession } from "../utils/api";

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useAdminUI();

  const closeDrawer = () => setMobileSidebarOpen(false);

  const handleLogout = () => {
    clearAdminSession();
    closeDrawer();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {mobileSidebarOpen && (
        <div className="admin-mobile-backdrop" onClick={closeDrawer} />
      )}
      <aside className={`ys-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand" style={{ justifyContent: "space-between" }}>
          <NavLink to="/" onClick={closeDrawer} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div className="sidebar-brand-logo">
              <img src={YogashriniLogo} alt="Yogashrini" />
            </div>
            <div>
              <div className="sidebar-brand-name">Yogashrini</div>
              <div className="sidebar-brand-sub">Executive Admin</div>
            </div>
          </NavLink>
          {mobileSidebarOpen && (
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close sidebar"
              style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer" }}
            >
              <MdClose size={22} />
            </button>
          )}
        </div>

        {/* Main Nav */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Main</div>
          <NavLink
            to="/"
            end
            onClick={closeDrawer}
            className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon"><MdDashboard /></span>
            Dashboard
          </NavLink>
        </div>

        {/* Courses */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Curriculum</div>
          <NavLink
            to="/courses"
            onClick={closeDrawer}
            className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon"><MdSchool /></span>
            All Courses
          </NavLink>
          <NavLink
            to="/addcourse"
            onClick={closeDrawer}
            className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon"><MdAddCircleOutline /></span>
            Add Course
          </NavLink>
          <NavLink
            to="/videos"
            onClick={closeDrawer}
            className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon"><MdVideoLibrary /></span>
            Manage Videos
          </NavLink>
        </div>

        {/* Products & Services */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Store & Services</div>
          <NavLink
            to="/addproduct"
            onClick={closeDrawer}
            className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon"><MdSpa /></span>
            Add Product
          </NavLink>
          <NavLink
            to="/listproduct"
            onClick={closeDrawer}
            className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon"><MdList /></span>
            List Products
          </NavLink>
        </div>

        {/* Retreats */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Retreats</div>
          <NavLink
            to="/addretreat"
            onClick={closeDrawer}
            className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon"><MdLocalActivity /></span>
            Add Retreat
          </NavLink>
          <NavLink
            to="/listretreat"
            onClick={closeDrawer}
            className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon"><RiBookLine /></span>
            List Retreats
          </NavLink>
        </div>

        {/* Logout */}
        <div style={{ marginTop: "auto", padding: "14px 12px", borderTop: "1px solid #1e1e30" }}>
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{ background: "none", border: "none", cursor: "pointer", width: "100%", color: "#ef4444" }}
          >
            <span className="nav-icon"><MdLogout /></span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
