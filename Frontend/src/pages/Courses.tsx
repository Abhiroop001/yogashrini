// src/pages/Courses.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MdStar, MdPlayCircle, MdSchool, MdAccessTime, MdFilterList, MdSearch } from "react-icons/md";
import { RiAwardLine } from "react-icons/ri";
import { Course } from "../types";

const API = "http://localhost:2000";

const COURSE_PLACEHOLDER_SVG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='360' viewBox='0 0 600 360'%3E%3Cdefs%3E%3ClinearGradient id='cg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23FF2D6F' stop-opacity='0.18'/%3E%3Cstop offset='100%25' stop-color='%237C3AED' stop-opacity='0.28'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23cg)'/%3E%3Ccircle cx='300' cy='160' r='52' fill='%23FF2D6F' fill-opacity='0.16'/%3E%3Cpath d='M290 142 L320 160 L290 178 Z' fill='%23FF2D6F'/%3E%3Ctext x='50%25' y='68%25' fill='%23CBD5E1' font-family='sans-serif' font-weight='600' font-size='16' text-anchor='middle'%3EYogashrini Curriculum%3C/text%3E%3C/svg%3E";

const getCourseThumbnail = (thumb?: string) => {
  if (!thumb) return null;
  if (thumb.startsWith("http://") || thumb.startsWith("https://") || thumb.startsWith("data:")) {
    return thumb;
  }
  return `${API}/thumbnails/${thumb}`;
};

const levelBadgeClass: Record<string, string> = {
  Beginner: "badge-emerald",
  Intermediate: "badge-primary",
  Advanced: "badge-accent",
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
    <div className="pb-5">
      {/* Hero Header */}
      <motion.div
        className="ud-hero-section mb-4"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="yoga-container">
          <div className="d-flex align-items-center gap-3">
            <div className="ud-ai-badge-icon">
              <MdSchool size={28} />
            </div>
            <div>
              <h1 className="m-0 fs-3 fw-bold">Comprehensive Yoga Curriculum</h1>
              <p className="text-secondary small m-0 mt-1">
                Master classical yoga, pranayama, and meditation through structured multi-week progressive video courses.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="yoga-container">
        {/* Controls Bar */}
        <div className="card p-3 mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-prominent)" }}>
                  <MdSearch style={{ color: "var(--text-muted)" }} size={18} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search courses by keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="d-flex align-items-center justify-content-md-end gap-2 overflow-auto pb-1">
                <span className="small fw-bold text-muted d-flex align-items-center gap-1 text-nowrap">
                  <MdFilterList /> Level:
                </span>
                {["All", "Beginner", "Intermediate", "Advanced"].map((lvl) => (
                  <button
                    key={lvl}
                    className={`btn btn-sm ${
                      filter === lvl ? "btn-primary" : "btn-secondary"
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

        {/* Content Section */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2 small">Loading curriculum library...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-5 p-4">
            <h5 className="fw-bold mb-1">No courses match your filter</h5>
            <p className="text-muted small mb-3">Try modifying your search keywords or level filter.</p>
            <div>
              <button
                className="btn btn-secondary btn-sm"
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
                const badgeClass = levelBadgeClass[course.level] || "badge-primary";
                return (
                  <motion.div
                    key={course._id}
                    className="col-12 col-md-6 col-lg-4"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                  >
                    <div
                      className="card h-100 overflow-hidden d-flex flex-column"
                      style={{ cursor: "pointer" }}
                      onClick={() => nav(`/course/${course._id}`)}
                    >
                      <div className="position-relative" style={{ height: "190px", backgroundColor: "var(--bg-secondary)" }}>
                        <img
                          src={getCourseThumbnail(course.thumbnail) || COURSE_PLACEHOLDER_SVG}
                          alt={course.title}
                          className="w-100 h-100 object-fit-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = COURSE_PLACEHOLDER_SVG;
                          }}
                        />
                        <span className={`position-absolute top-0 start-0 m-3 badge-pill ${badgeClass}`}>
                          {course.level}
                        </span>
                        <span className="position-absolute bottom-0 end-0 m-3 badge bg-dark bg-opacity-75 rounded-pill px-3 py-1 small d-flex align-items-center gap-1 text-white">
                          <MdAccessTime size={14} /> {course.durationWeeks ? `${course.durationWeeks} Weeks` : "Self-Paced"}
                        </span>
                      </div>

                      <div className="card-body p-4 d-flex flex-column flex-grow-1">
                        <h5 className="fw-bold mb-2">{course.title}</h5>
                        <p className="text-secondary small flex-grow-1" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {course.description}
                        </p>

                        <div className="d-flex align-items-center justify-content-between pt-3 mt-auto border-top">
                          <div>
                            <span className="fs-5 fw-bold" style={{ color: "var(--brand-primary)" }}>
                              {course.price === 0 ? "Free" : `₹${course.price}`}
                            </span>
                          </div>
                          <span className="btn btn-primary btn-sm">
                            <MdPlayCircle size={16} /> View Course
                          </span>
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
    </div>
  );
};

export default Courses;
