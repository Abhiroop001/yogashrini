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
} from "react-icons/md";
import { RiBookLine } from "react-icons/ri";
import YogashriniLogo from "./Yogashrini.jpg";

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("uname");
    navigate("/login");
  };

  return (
    <aside className="ys-sidebar">
      {/* Brand */}
      <NavLink to="/" className="sidebar-brand" style={{ textDecoration: "none" }}>
        <div className="sidebar-brand-logo">
          <img src={YogashriniLogo} alt="Yogashrini" />
        </div>
        <div>
          <div className="sidebar-brand-name">Yogashrini</div>
          <div className="sidebar-brand-sub">Executive Admin</div>
        </div>
      </NavLink>

      {/* Main Nav */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Main</div>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">
            <MdDashboard />
          </span>
          Dashboard
        </NavLink>
      </div>

      {/* Courses */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Curriculum</div>

        <NavLink
          to="/courses"
          className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">
            <MdSchool />
          </span>
          All Courses
        </NavLink>

        <NavLink
          to="/addcourse"
          className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">
            <MdAddCircleOutline />
          </span>
          Add Course
        </NavLink>

        <NavLink
          to="/videos"
          className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">
            <MdVideoLibrary />
          </span>
          Manage Videos
        </NavLink>
      </div>

      {/* Products & Services */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Store & Services</div>

        <NavLink
          to="/addproduct"
          className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">
            <MdSpa />
          </span>
          Add Product
        </NavLink>

        <NavLink
          to="/listproduct"
          className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">
            <MdList />
          </span>
          List Products
        </NavLink>
      </div>

      {/* Retreats */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Retreats</div>

        <NavLink
          to="/addretreat"
          className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">
            <MdLocalActivity />
          </span>
          Add Retreat
        </NavLink>

        <NavLink
          to="/listretreat"
          className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">
            <RiBookLine />
          </span>
          List Retreats
        </NavLink>
      </div>

      {/* Logout */}
      <div style={{ marginTop: "auto", padding: "16px 12px", borderTop: "1px solid #1e1e30" }}>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item"
          style={{ background: "none", border: "none", cursor: "pointer", width: "100%", color: "#ef4444" }}
        >
          <span className="nav-icon">
            <MdLogout />
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
