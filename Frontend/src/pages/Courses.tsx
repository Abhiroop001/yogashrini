// Frontend/src/pages/Courses.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdPlayCircle,
  MdSchool,
  MdAccessTime,
  MdFilterList,
  MdSearch,
  MdLibraryBooks,
  MdCheckCircle,
  MdLogin,
  MdRefresh,
  MdStar,
} from "react-icons/md";
import { RiAwardLine } from "react-icons/ri";
import { Course, EnrollmentRecord } from "../types";
import { API_BASE, authFetch } from "../utils/api";
import { useAuth } from "../AuthContext";

const COURSE_PLACEHOLDER_SVG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='360' viewBox='0 0 600 360'%3E%3Cdefs%3E%3ClinearGradient id='cg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23FF2D6F' stop-opacity='0.22'/%3E%3Cstop offset='100%25' stop-color='%237C3AED' stop-opacity='0.32'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23cg)'/%3E%3Ccircle cx='300' cy='160' r='52' fill='%23FF2D6F' fill-opacity='0.2'/%3E%3Cpath d='M290 142 L320 160 L290 178 Z' fill='%23FF2D6F'/%3E%3Ctext x='50%25' y='68%25' fill='%23E2E8F0' font-family='sans-serif' font-weight='600' font-size='16' text-anchor='middle'%3EYogashrini Curriculum%3C/text%3E%3C/svg%3E";

const getCourseThumbnail = (thumb?: string) => {
  if (!thumb) return null;
  if (thumb.startsWith("http://") || thumb.startsWith("https://") || thumb.startsWith("data:")) {
    return thumb;
  }
  return `${API_BASE}/thumbnails/${thumb}`;
};

function getEnrollmentProgress(enrollment: EnrollmentRecord) {
  const course = enrollment.courseId;
  const availableWeeks = (enrollment.regularWeeksAvailable || []).slice().sort((a, b) => a - b);
  const completedWeeks = enrollment.completedWeeks || [];
  const totalWeeks = Math.max(
    availableWeeks.length,
    Number(course.totalWeeks) || Number(course.durationWeeks) || 1
  );
  const completedCount =
    availableWeeks.length > 0
      ? availableWeeks.filter((w) => completedWeeks.includes(w)).length
      : completedWeeks.length;
  const pct = Math.min(100, Math.round((completedCount / Math.max(1, totalWeeks)) * 100));
  const nextWeek =
    availableWeeks.find((w) => !completedWeeks.includes(w)) ??
    (availableWeeks.length > 0 ? availableWeeks[0] : null);
  const isCompleted = totalWeeks > 0 && completedCount >= totalWeeks;

  return {
    availableWeeks,
    totalWeeks,
    completedCount,
    pct,
    nextWeek,
    isCompleted,
  };
}

export const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);

  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState<boolean>(false);
  const [enrollError, setEnrollError] = useState<string>("");

  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const activeUserId = user?.id || user?._id || "";
  const nav = useNavigate();

  // Fetch published course catalog
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/course`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (!controller.signal.aborted) {
          setCourses(d.courses || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Fetch persistent purchased courses strictly scoped to the signed-in account
  const loadMyEnrollments = useCallback(
    async (signal?: AbortSignal) => {
      if (authLoading) return;

      if (!isAuthenticated || !token || !activeUserId) {
        setEnrollments([]);
        setEnrollError("");
        setEnrolledLoading(false);
        return;
      }

      setEnrolledLoading(true);
      setEnrollError("");
      try {
        const resp = await authFetch("/payment/enrollment/my", { signal });
        if (signal?.aborted) return;
        if (!resp.ok) {
          throw new Error("Could not load your enrolled courses.");
        }
        const data = await resp.json();
        if (signal?.aborted) return;

        const clean: EnrollmentRecord[] = (data.enrollments || []).filter(
          (e: EnrollmentRecord) => Boolean(e && e.isPaid && e.courseId && e.courseId._id)
        );
        setEnrollments(clean);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setEnrollError("Unable to sync your purchased courses right now.");
      } finally {
        if (!signal?.aborted) setEnrolledLoading(false);
      }
    },
    [authLoading, isAuthenticated, token, activeUserId]
  );

  useEffect(() => {
    const controller = new AbortController();
    if (!isAuthenticated || !token) {
      setEnrollments([]);
      setEnrollError("");
    }
    loadMyEnrollments(controller.signal);
    return () => controller.abort();
  }, [loadMyEnrollments, isAuthenticated, token]);

  const enrolledByCourseId = useMemo(() => {
    const map = new Map<string, EnrollmentRecord>();
    for (const e of enrollments) {
      if (e.courseId?._id) {
        map.set(String(e.courseId._id), e);
      }
    }
    return map;
  }, [enrollments]);

  const filtered = courses.filter((c) => {
    const matchSearch =
      (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || c.level === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="pb-5">
      {/* Compact Hero Header */}
      <motion.header
        className="ud-hero-section mb-3"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="yoga-container">
          <div className="d-flex align-items-center gap-3">
            <div className="ud-ai-badge-icon">
              <MdSchool size={24} />
            </div>
            <div>
              <h1 className="m-0 fs-3 fw-bold">Comprehensive Yoga Curriculum</h1>
              <p className="text-secondary small m-0 mt-1">
                Master classical yoga, pranayama, and meditation through structured multi-week progressive video courses.
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="yoga-container">
        {/* ── My Courses Section (Persistent Per Logged-In Account) ───────── */}
        <motion.section
          aria-labelledby="my-courses-heading"
          className="mb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div
            className="card p-3 p-md-4"
            style={{ borderTop: "3px solid var(--brand-primary)" }}
          >
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div className="d-flex align-items-center gap-3">
                <div className="ud-ai-badge-icon" style={{ width: 38, height: 38 }}>
                  <MdLibraryBooks size={19} />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h2 id="my-courses-heading" className="m-0 fs-5 fw-bold">
                      My Courses
                    </h2>
                    {isAuthenticated && !enrolledLoading && !authLoading && (
                      <span className="badge-pill badge-primary">
                        {enrollments.length} {enrollments.length === 1 ? "Course" : "Courses"}
                      </span>
                    )}
                  </div>
                  <p className="text-secondary small m-0">
                    {isAuthenticated
                      ? `Purchased courses synced to ${user?.name || user?.email}`
                      : "Sign in to view your purchased courses and track week-by-week progress."}
                  </p>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => loadMyEnrollments()}
                  disabled={enrolledLoading}
                  aria-label="Refresh my courses"
                >
                  <MdRefresh size={16} /> Refresh
                </button>
              ) : (
                !authLoading && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => nav("/login", { state: { from: "/courses" } })}
                  >
                    <MdLogin size={16} /> Sign In to View
                  </button>
                )
              )}
            </div>

            {authLoading || enrolledLoading ? (
              <div className="d-flex align-items-center gap-2 py-3 text-secondary small">
                <div className="spinner-border spinner-border-sm text-primary" role="status" />
                <span>Syncing your enrolled courses...</span>
              </div>
            ) : !isAuthenticated ? (
              <div
                className="p-3 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span className="small text-secondary">
                  Your purchased courses automatically appear here whenever you log into your account.
                </span>
              </div>
            ) : enrollError ? (
              <div className="alert alert-danger py-2 px-3 small m-0 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span>{enrollError}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => loadMyEnrollments()}
                >
                  Retry
                </button>
              </div>
            ) : enrollments.length === 0 ? (
              <div
                className="p-3 rounded-3 text-center"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px dashed var(--border-prominent)",
                }}
              >
                <p className="fw-semibold small mb-1">No purchased courses on this account yet</p>
                <p className="text-secondary small m-0">
                  Enroll in any free or paid course in the catalog below and it will stay saved here permanently.
                </p>
              </div>
            ) : (
              <div className="row g-3">
                <AnimatePresence>
                  {enrollments.map((enrollment, idx) => {
                    const course = enrollment.courseId;
                    const prog = getEnrollmentProgress(enrollment);
                    const resumePath =
                      prog.nextWeek !== null
                        ? `/course/${course._id}/week/${prog.nextWeek}`
                        : `/course/${course._id}`;
                    const resumeLabel =
                      prog.nextWeek === null
                        ? "View Syllabus"
                        : prog.completedCount === 0
                        ? `Start Week ${prog.nextWeek}`
                        : prog.isCompleted
                        ? "Review Course"
                        : `Continue Week ${prog.nextWeek}`;

                    return (
                      <motion.div
                        key={enrollment._id || course._id}
                        className="col-12 col-md-6 col-lg-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        whileHover={{ y: -3 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                      >
                        <div
                          className="card h-100 overflow-hidden d-flex flex-column"
                          style={{
                            border: "1px solid var(--border-prominent)",
                            background: "var(--bg-surface-elevated)",
                          }}
                        >
                          <div
                            className="position-relative"
                            style={{
                              aspectRatio: "16 / 9",
                              backgroundColor: "var(--bg-secondary)",
                              overflow: "hidden",
                              cursor: "pointer",
                            }}
                            onClick={() => nav(resumePath)}
                          >
                            <img
                              src={getCourseThumbnail(course.thumbnail) || COURSE_PLACEHOLDER_SVG}
                              alt={course.title}
                              loading="lazy"
                              className="w-100 h-100 object-fit-cover"
                              style={{ objectPosition: "center 20%" }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = COURSE_PLACEHOLDER_SVG;
                              }}
                            />
                            <span
                              className="position-absolute top-0 start-0 m-2 badge-pill"
                              style={{
                                background: "#059669",
                                color: "#ffffff",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.28)",
                              }}
                            >
                              <MdCheckCircle size={13} /> Purchased
                            </span>
                            {course.level && (
                              <span className="position-absolute top-0 end-0 m-2 badge-pill badge-overlay-surface">
                                {course.level}
                              </span>
                            )}
                          </div>

                          <div className="card-body p-3 d-flex flex-column flex-grow-1">
                            <h5
                              className="fw-bold mb-1 fs-6"
                              style={{ cursor: "pointer" }}
                              onClick={() => nav(`/course/${course._id}`)}
                            >
                              {course.title}
                            </h5>

                            <div className="d-flex align-items-center gap-2 flex-wrap mb-2 small text-secondary">
                              {enrollment.purchasedAt && (
                                <span>
                                  Enrolled{" "}
                                  {new Date(enrollment.purchasedAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                              {Number(enrollment.totalXP) > 0 && (
                                <span className="badge-pill badge-accent">
                                  <RiAwardLine size={12} /> {enrollment.totalXP} XP
                                </span>
                              )}
                              {enrollment.bonusUnlocked && (
                                <span className="badge-pill badge-primary">
                                  <MdStar size={12} /> Bonus Unlocked
                                </span>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="d-flex justify-content-between small mb-1">
                                <span className="text-secondary fw-semibold">Progress</span>
                                <span className="fw-bold" style={{ color: prog.isCompleted ? "#10b981" : "var(--brand-primary)" }}>
                                  {prog.completedCount}/{prog.totalWeeks} Weeks ({prog.pct}%)
                                </span>
                              </div>
                              <div
                                className="rounded-pill overflow-hidden"
                                style={{ height: 7, background: "var(--bg-secondary)" }}
                              >
                                <div
                                  className="h-100 rounded-pill"
                                  style={{
                                    width: `${prog.pct}%`,
                                    background: prog.isCompleted
                                      ? "#10b981"
                                      : "linear-gradient(90deg, var(--brand-primary), var(--brand-accent))",
                                    transition: "width 0.35s ease",
                                  }}
                                />
                              </div>
                            </div>

                            <div className="d-flex gap-2 mt-auto pt-2 border-top flex-wrap">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm flex-grow-1"
                                onClick={() => nav(resumePath)}
                              >
                                <MdPlayCircle size={16} /> {resumeLabel}
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => nav(`/course/${course._id}`)}
                              >
                                Overview
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
          </div>
        </motion.section>

        {/* Responsive Wrapped Controls Bar */}
        <div className="card p-3 mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-5">
              <div className="input-group input-group-sm">
                <label htmlFor="courses-search-input" className="visually-hidden">Search courses</label>
                <span className="input-group-text" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-prominent)" }}>
                  <MdSearch style={{ color: "var(--text-muted)" }} size={18} />
                </span>
                <input
                  id="courses-search-input"
                  name="search"
                  type="text"
                  className="form-control"
                  placeholder="Search courses by keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="compact-filter-bar justify-content-lg-end">
                <span className="small fw-bold text-muted d-flex align-items-center gap-1 me-1">
                  <MdFilterList /> Level:
                </span>
                {["All", "Beginner", "Intermediate", "Advanced"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
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

        <h2 className="fs-5 fw-bold mb-3">All Available Courses</h2>

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
                type="button"
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
          <div className="row g-3">
            <AnimatePresence>
              {filtered.map((course, idx) => {
                const ownedEnrollment = enrolledByCourseId.get(String(course._id));
                const isOwned = Boolean(ownedEnrollment);

                return (
                  <motion.div
                    key={course._id}
                    className="col-12 col-md-6 col-lg-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.22, delay: idx * 0.03 }}
                  >
                    <div
                      className="card h-100 overflow-hidden d-flex flex-column"
                      style={{ cursor: "pointer" }}
                      onClick={() => nav(`/course/${course._id}`)}
                    >
                      <div
                        className="position-relative"
                        style={{
                          aspectRatio: "16 / 10",
                          backgroundColor: "var(--bg-secondary)",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={getCourseThumbnail(course.thumbnail) || COURSE_PLACEHOLDER_SVG}
                          alt={course.title}
                          loading="lazy"
                          className="w-100 h-100 object-fit-cover"
                          style={{ objectPosition: "center 20%" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = COURSE_PLACEHOLDER_SVG;
                          }}
                        />
                        <span className="position-absolute top-0 start-0 m-2 badge-pill badge-overlay-surface">
                          {course.level || "Beginner"}
                        </span>
                        {isOwned && (
                          <span
                            className="position-absolute top-0 end-0 m-2 badge-pill"
                            style={{
                              background: "#059669",
                              color: "#ffffff",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.28)",
                            }}
                          >
                            <MdCheckCircle size={13} /> Enrolled
                          </span>
                        )}
                        <span className="position-absolute bottom-0 end-0 m-2 badge-pill badge-overlay-surface">
                          <MdAccessTime size={13} />{" "}
                          {course.totalWeeks || course.durationWeeks
                            ? `${course.totalWeeks || course.durationWeeks} Weeks`
                            : "Self-Paced"}
                        </span>
                      </div>

                      <div className="card-body p-3 d-flex flex-column flex-grow-1">
                        <h5 className="fw-bold mb-1 fs-6">{course.title}</h5>
                        <p
                          className="text-secondary small flex-grow-1 mb-3"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {course.description}
                        </p>

                        <div className="d-flex align-items-center justify-content-between pt-2 mt-auto border-top">
                          {isOwned ? (
                            <span className="badge-pill badge-emerald">
                              <MdCheckCircle size={14} /> Purchased
                            </span>
                          ) : (
                            <span className="fs-5 fw-bold" style={{ color: "var(--brand-primary)" }}>
                              {course.price === 0 ? "Free" : `₹${course.price}`}
                            </span>
                          )}
                          <span className="btn btn-primary btn-sm">
                            <MdPlayCircle size={15} /> {isOwned ? "Open Course" : "View Course"}
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
      </div>
    </div>
  );
};

export default Courses;
