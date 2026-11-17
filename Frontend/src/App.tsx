// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

import UserDashboard from "./pages/UserDashboard";
import About from "./pages/About";
import Classes from "./pages/Classes";
import Retreat from "./pages/Retreat";
import Training from "./pages/Training";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Posture from "./pages/Posture";
import LiveTrainer from "./pages/LiveTrainer";
import Types from "./pages/Types";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import WeekPlayer from "./pages/WeekPlayer";

import Chatbot from "./inc/Chatbot";

import "./App.css";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-wrapper d-flex flex-column min-vh-100">
          <main className="flex-grow-1">
            <div className="container py-4">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/" element={<UserDashboard />} />
                <Route path="/about" element={<About />} />
                <Route path="/classes" element={<Classes />} />
                <Route path="/retreat" element={<Retreat />} />
                <Route path="/training" element={<Training />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/posture" element={<Posture />} />
                <Route path="/live-trainer" element={<LiveTrainer />} />
                <Route path="/types" element={<Types />} />

                {/* Learning Platform */}
                <Route path="/courses" element={<Courses />} />
                <Route path="/course/:id" element={<CourseDetail />} />
                <Route path="/course/:id/week/:weekNum" element={<WeekPlayer />} />

                <Route
                  path="*"
                  element={
                    <div className="text-center py-5">
                      <h3>Page not found</h3>
                    </div>
                  }
                />
              </Routes>
            </div>
          </main>

          {/* Global AI RAG Chatbot */}
          <Chatbot />

          {/* Footer */}
          <footer className="bg-dark text-light py-3 mt-auto">
            <div className="container text-center small">
              (C) {new Date().getFullYear()} Yogashrini - Classical Yoga & Movement Intelligence Platform
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
