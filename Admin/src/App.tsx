import React, { createContext, useContext, useState, useEffect, Suspense, lazy, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import {
  API_BASE,
  getAdminToken,
  clearAdminSession,
  saveAdminSession,
  getStoredAdmin,
} from "./utils/api";
import "./App.css";

// Lazy-loaded Admin routes so Recharts & heavy CRUD forms load on demand
const Dashboard   = lazy(() => import("./pages/Dashboard"));
const Addproduct  = lazy(() => import("./pages/Addproduct"));
const Listproduct = lazy(() => import("./pages/Listproduct"));
const Editproduct = lazy(() => import("./pages/Editproduct"));
const Addretreat  = lazy(() => import("./pages/Addretreat"));
const Listretreat = lazy(() => import("./pages/Listretreat"));
const Editretreat = lazy(() => import("./pages/Editretreat"));
const Login       = lazy(() => import("./pages/Login"));
const CourseList  = lazy(() => import("./pages/CourseList"));
const AddCourse   = lazy(() => import("./pages/AddCourse"));
const EditCourse  = lazy(() => import("./pages/EditCourse"));
const ManageCourse = lazy(() => import("./pages/ManageCourse"));

interface AdminUIContextValue {
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const AdminUIContext = createContext<AdminUIContextValue>({
  mobileSidebarOpen: false,
  setMobileSidebarOpen: () => {},
  theme: "light",
  toggleTheme: () => {},
});

export const useAdminUI = () => useContext(AdminUIContext);

const AdminLoader: React.FC = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
    <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading executive module...</span>
  </div>
);

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">(() =>
    getAdminToken() ? "checking" : "invalid"
  );
  const location = useLocation();

  const verify = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      setStatus("invalid");
      return;
    }

    try {
      const r = await fetch(`${API_BASE}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Unauthorized");
      const data = await r.json();
      if (data.authenticated && data.admin) {
        saveAdminSession(token, data.admin);
        setStatus("valid");
      } else {
        throw new Error("Invalid session");
      }
    } catch {
      clearAdminSession();
      setStatus("invalid");
    }
  }, []);

  useEffect(() => {
    verify();
    const expiredHandler = () => setStatus("invalid");
    window.addEventListener("admin:auth-expired", expiredHandler);
    return () => window.removeEventListener("admin:auth-expired", expiredHandler);
  }, [verify]);

  if (status === "checking" && getStoredAdmin()) {
    return <AdminLoader />;
  }
  if (status === "invalid") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("admin_theme") === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("admin_theme", next);
      return next;
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <AdminUIContext.Provider value={{ mobileSidebarOpen, setMobileSidebarOpen, theme, toggleTheme }}>
        <BrowserRouter>
          <Suspense fallback={<AdminLoader />}>
            <Routes>
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/courses" element={<PrivateRoute><CourseList /></PrivateRoute>} />
              <Route path="/videos" element={<PrivateRoute><CourseList /></PrivateRoute>} />
              <Route path="/addcourse" element={<PrivateRoute><AddCourse /></PrivateRoute>} />
              <Route path="/editcourse/:id" element={<PrivateRoute><EditCourse /></PrivateRoute>} />
              <Route path="/managecourse/:id" element={<PrivateRoute><ManageCourse /></PrivateRoute>} />
              <Route path="/addproduct" element={<PrivateRoute><Addproduct /></PrivateRoute>} />
              <Route path="/listproduct" element={<PrivateRoute><Listproduct /></PrivateRoute>} />
              <Route path="/editproduct/:id" element={<PrivateRoute><Editproduct /></PrivateRoute>} />
              <Route path="/addretreat" element={<PrivateRoute><Addretreat /></PrivateRoute>} />
              <Route path="/listretreat" element={<PrivateRoute><Listretreat /></PrivateRoute>} />
              <Route path="/editretreat/:id" element={<PrivateRoute><Editretreat /></PrivateRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AdminUIContext.Provider>
    </MotionConfig>
  );
};

export default App;
