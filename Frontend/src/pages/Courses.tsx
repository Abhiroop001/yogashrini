import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
import { MdStar, MdPlayCircle, MdSchool, MdAccessTime, MdFilterList, MdSearch } from "react-icons/md";
import { RiAwardLine } from "react-icons/ri";
import { Course } from "../types";

const API = "http://localhost:2000";

const levelColor: Record<string, { bg: string; color: string }> = {
  Beginner: { bg: "#ecfdf5", color: "#065f46" },
  Intermediate: { bg: "#fffbeb", color: "#92400e" },
  Advanced: { bg: "#fef2f2", color: "#991b1b" },
};

export const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const nav = useNavigate();

  useEffect(() => {
    fetch(`${API}/course`)
      .then((r) => r.json())
      .then((d) => {
        setCourses(d.courses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) => {
    const matchSearch =
      (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || c.level === filter;
    return matchSearch && matchFilter;
  });

  return (
    <>
      <Navbar />

      {/* Hero */}
      <motion.div
        className="ud-hero mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="ud-hero-inner container">
          <div className="ud-hero-left">
            <MdSchool size={64} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
            <div className="ud-hero-title-wrap">
              <h1 className="ud-title">Comprehensive Yoga Curriculum</h1>
              <p className="ud-subtitle">
                Master classical yoga, pranayama, and meditation through structured multi-week progressive video
                courses guided by seasoned masters.
              </p>
              <div className="posture-hero-badges">
                <span className="posture-badge">Multi-Week Roadmaps</span>
                <span className="posture-badge">Self-Paced Practice</span>
                <span className="posture-badge">Certificate of Completion</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="container pb-5">
        {/* Controls */}
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-0">
                  <MdSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-0"
                  placeholder="Search courses by keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="d-flex align-items-center justify-content-md-end gap-2 overflow-auto">
                <span className="text-muted small fw-bold d-flex align-items-center gap-1 text-nowrap">
                  <MdFilterList /> Level:
                </span>
                {["All", "Beginner", "Intermediate", "Advanced"].map((lvl) => (
                  <button
                    key={lvl}
                    className={`btn btn-sm rounded-pill px-3 text-nowrap ${
                      filter === lvl ? "btn-primary shadow-sm" : "btn-light"
                    }`}
                    onClick={() => setFilter(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading courses...</span>
            </div>
            <p className="text-muted mt-2 small">Loading curriculum library...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 card border-0 shadow-sm rounded-4 p-5">
            <h5 className="fw-bold text-dark">No courses match your filter</h5>
            <p className="text-muted small">Try modifying your search keywords or level filter.</p>
            <div>
              <button
                className="btn btn-primary rounded-pill px-4"
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            <AnimatePresence>
              {filtered.map((course, idx) => {
                const badge = levelColor[course.level] || { bg: "#f3f4f6", color: "#374151" };
                return (
                  <motion.div
                    key={course._id}
                    className="col-12 col-md-6 col-lg-4"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <div
                      className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column hover-lift"
                      style={{ cursor: "pointer" }}
                      onClick={() => nav(`/course/${course._id}`)}
                    >
                      <div className="position-relative" style={{ height: "190px", backgroundColor: "#e2e8f0" }}>
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-100 h-100 object-fit-cover"
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                            <MdSchool size={48} className="opacity-25" />
                          </div>
                        )}
                        <span
                          className="position-absolute top-0 start-0 m-3 px-3 py-1 rounded-pill small fw-bold"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {course.level}
                        </span>
                        <span className="position-absolute bottom-0 end-0 m-3 badge bg-dark bg-opacity-75 rounded-pill px-3 py-1 small d-flex align-items-center gap-1">
                          <MdAccessTime /> {course.durationWeeks ? `${course.durationWeeks} Weeks` : "Self-Paced"}
                        </span>
                      </div>

                      <div className="card-body p-4 d-flex flex-column flex-grow-1">
                        <h5 className="fw-bold text-dark mb-2">{course.title}</h5>
                        <p className="text-muted small mb-3 flex-grow-1" style={{ lineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {course.description || "Structured yogic training modules with step-by-step guidance."}
                        </p>

                        <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                          <div>
                            <span className="text-muted small d-block">Tuition</span>
                            <span className="fw-bold text-dark fs-5">
                              {course.price ? `INR ${course.price}` : "Complimentary"}
                            </span>
                          </div>
                          <button
                            className="btn btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              nav(`/course/${course._id}`);
                            }}
                          >
                            <MdPlayCircle /> Explore
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Courses;
