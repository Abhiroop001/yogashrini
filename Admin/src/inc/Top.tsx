import React from "react";
import { MdNotifications, MdSearch, MdMenu, MdDarkMode, MdLightMode } from "react-icons/md";
import { RiAdminLine } from "react-icons/ri";
import { useAdminUI } from "../App";
import { getStoredAdmin } from "../utils/api";

interface TopProps {
  title?: string;
}

export const Top: React.FC<TopProps> = ({ title = "Dashboard" }) => {
  const { setMobileSidebarOpen, theme, toggleTheme } = useAdminUI();
  const storedAdmin = getStoredAdmin();
  const username = storedAdmin?.name || localStorage.getItem("uname") || "Administrator";

  const initials = username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="ys-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <button
          type="button"
          className="admin-hamburger-btn"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <MdMenu size={20} />
        </button>
        <div className="page-title" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title}
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search-box">
          <MdSearch style={{ color: "var(--text-muted)", fontSize: 16 }} />
          <label htmlFor="admin-top-search" style={{ display: "none" }}>Search platform</label>
          <input id="admin-top-search" name="search" placeholder="Search platform..." />
        </div>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle dark/light theme"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <MdDarkMode size={18} /> : <MdLightMode size={18} />}
        </button>

        <button type="button" className="topbar-icon-btn" aria-label="Notifications">
          <MdNotifications />
          <span className="topbar-badge">3</span>
        </button>

        <div className="topbar-user">
          <div className="topbar-avatar">{initials || "AD"}</div>
          <div className="topbar-user-meta">
            <div className="topbar-username">{username}</div>
            <div className="topbar-role">
              <RiAdminLine style={{ fontSize: 10 }} /> Executive
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Top;
