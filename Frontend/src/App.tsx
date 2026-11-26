// Frontend/src/App.tsx
// Root Application with Lazy-Loaded Code-Split Routes, MotionConfig, and Global Layout
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { MotionConfig, AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./AuthContext";
import Navbar from "./inc/Navbar";
import PageLoader from "./components/PageLoader";
import "./App.css";

// Lazy-loaded pages & widgets (separates bundles for faster initial load)
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const About         = lazy(() => import("./pages/About"));
const Classes       = lazy(() => import("./pages/Classes"));
const Retreat       = lazy(() => import("./pages/Retreat"));
const Training      = lazy(() => import("./pages/Training"));
const Contact       = lazy(() => import("./pages/Contact"));
const Login         = lazy(() => import("./pages/Login"));
const Signup        = lazy(() => import("./pages/Signup"));
const Posture       = lazy(() => import("./pages/Posture"));
const LiveTrainer   = lazy(() => import("./pages/LiveTrainer"));
const Types         = lazy(() => import("./pages/Types"));
const Courses       = lazy(() => import("./pages/Courses"));
const CourseDetail  = lazy(() => import("./pages/CourseDetail"));
const WeekPlayer    = lazy(() => import("./pages/WeekPlayer"));
const Chatbot       = lazy(() => import("./inc/Chatbot"));

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<UserDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/retreat" element={<Retreat />} />
            <Route path="/training" element={<Training />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/posture" element={<Posture />} />
            <Route path="/live-trainer" element={<LiveTrainer />} />
            <Route path="/types" element={<Types />} />

            {/* Learning Curriculum Platform */}
            <Route path="/courses" element={<Courses />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/course/:id/week/:weekNum" element={<WeekPlayer />} />

            {/* Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="*"
              element={
                <div className="yoga-container py-5 text-center">
                  <h2 className="mb-2">404 - Page Not Found</h2>
                  <p className="text-muted">The requested path does not exist in the curriculum.</p>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <Router>
          <div className="app-wrapper">
            <Navbar />

            <main className="main-content-flow">
              <AnimatedRoutes />
            </main>

            <Suspense fallback={null}>
              <Chatbot />
            </Suspense>

            <footer className="yoga-global-footer">
              <div className="yoga-container">
                (C) {new Date().getFullYear()} Yogashrini - Classical Yoga & Movement Intelligence Platform
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </MotionConfig>
  );
};

export default App;
