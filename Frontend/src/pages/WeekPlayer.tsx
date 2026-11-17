// src/pages/WeekPlayer.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdPlayCircle,
  MdArrowBack,
  MdArrowForward,
  MdCheckCircle,
  MdStar,
  MdList,
} from "react-icons/md";
import { RiAwardLine, RiTrophyLine } from "react-icons/ri";

const API = "http://localhost:2000";

interface VideoData {
  title: string;
  filename: string;
  description?: string;
}

interface WeekData {
  _id: string;
  weekNumber: number;
  title: string;
  description?: string;
  isBonus?: boolean;
  bonusXP: number;
  bonusPoints: number;
  videos: VideoData[];
}

interface EnrollmentStatus {
  completedWeeks?: number[];
  bonusUnlocked?: boolean;
  totalXP?: number;
}

interface CourseOverview {
  _id: string;
  title: string;
}

export const WeekPlayer: React.FC = () => {
  const { id, weekNum } = useParams<{ id: string; weekNum: string }>();
  const nav = useNavigate();

  const [course, setCourse] = useState<CourseOverview | null>(null);
  const [allWeeks, setAllWeeks] = useState<WeekData[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentStatus | null>(null);
  const [activeVideo, setActiveVideo] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [completed, setCompleted] = useState<boolean>(false);
  const [xpModal, setXpModal] = useState<{ xp: number; bonusUnlocked?: boolean } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const userId = localStorage.getItem("uid") || "";

  useEffect(() => {
    Promise.all([
      fetch(`${API}/course/${id}`).then((r) => r.json()),
      fetch(`${API}/course/${id}/weeks`).then((r) => r.json()),
      userId
        ? fetch(`${API}/payment/enrollment/check/${id}?userId=${userId}`).then((r) => r.json())
        : Promise.resolve({ enrolled: false }),
    ])
      .then(([cData, wData, eData]) => {
        setCourse(cData.course || null);
        setAllWeeks(wData.weeks || []);
        setEnrollment(eData.enrollment || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, userId]);

  const currentWeekNum = parseInt(weekNum || "1", 10);
  const week = allWeeks.find((w) => w.weekNumber === currentWeekNum);
  const currentVideo = week?.videos?.[activeVideo];

  const handleComplete = async () => {
    if (!userId || !week) return;
    try {
      const r = await fetch(`${API}/payment/enrollment/complete-week`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId: id, weekNumber: currentWeekNum }),
      });
      const data = await r.json();
      if (r.ok) {
        setCompleted(true);
        setXpModal({ xp: data.xpEarned || week.bonusXP, bonusUnlocked: data.bonusUnlocked });
        setEnrollment((prev) => ({
          ...prev,
          completedWeeks: [...(prev?.completedWeeks || []), currentWeekNum],
          bonusUnlocked: data.bonusUnlocked || prev?.bonusUnlocked,
        }));
      }
    } catch (e) {
      console.error("Failed to complete week:", e);
    }
  };

  if (loading) {
    return (
      <div className="yoga-container text-center py-5 my-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-2 small">Loading player...</p>
      </div>
    );
  }

  if (!week) {
    return (
      <div className="yoga-container text-center py-5 my-5">
        <h4>Week module not found</h4>
        <button className="btn btn-secondary mt-3" onClick={() => nav(`/course/${id}`)}>
          Back to Course
        </button>
      </div>
    );
  }

  const isAlreadyCompleted = enrollment?.completedWeeks?.includes(currentWeekNum);
  const prevWeek = allWeeks.find((w) => w.weekNumber === currentWeekNum - 1);
  const nextWeek = allWeeks.find((w) => w.weekNumber === currentWeekNum + 1);

  return (
    <div className="d-flex flex-column" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* Top Header Bar */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => nav(`/course/${id}`)}
            className="btn btn-sm btn-secondary"
            title="Return to Syllabus"
          >
            <MdArrowBack size={18} />
          </button>
          <div>
            <div className="fw-bold fs-6">{course?.title || "Yoga Course"}</div>
            <div className="text-muted small">
              Week {week.weekNumber}: {week.title}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isAlreadyCompleted && (
            <span className="badge-pill badge-emerald">
              <MdCheckCircle /> Completed
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="btn btn-sm btn-secondary"
            title="Toggle Syllabus Playlist"
          >
            <MdList size={18} />
          </button>
        </div>
      </div>

      {/* Main Player & Playlist Grid */}
      <div className="row g-0 flex-grow-1">
        {/* Video Player Column */}
        <div className={`col-12 ${sidebarOpen ? "col-lg-8" : "col-12"} d-flex flex-column`}>
          <div
            className="bg-black position-relative text-center d-flex align-items-center justify-content-center"
            style={{ width: "100%", aspectRatio: "16 / 9", maxHeight: "65vh" }}
          >
            {currentVideo ? (
              <video
                ref={videoRef}
                src={`${API}/videos/${currentVideo.filename}`}
                controls
                className="w-100 h-100 object-fit-contain"
                onEnded={() => {
                  if (activeVideo < week.videos.length - 1) {
                    setActiveVideo((v) => v + 1);
                  }
                }}
              />
            ) : (
              <div className="text-muted py-5 text-center">
                <MdPlayCircle size={64} className="mb-2 opacity-50" />
                <p className="small m-0">No videos configured for this weekly module</p>
              </div>
            )}
          </div>

          {/* Video Metadata Panel */}
          <div className="p-4 flex-grow-1" style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <h4 className="fw-bold mb-1 fs-5">{currentVideo?.title || week.title}</h4>
                {currentVideo?.description && (
                  <p className="text-secondary small mb-0">{currentVideo.description}</p>
                )}
              </div>

              <div>
                {!isAlreadyCompleted && !completed ? (
                  <button
                    onClick={handleComplete}
                    className="btn btn-primary"
                  >
                    <MdCheckCircle size={18} /> Mark Complete (+{week.bonusXP} XP)
                  </button>
                ) : (
                  <div className="d-flex align-items-center gap-2 text-success fw-bold">
                    <MdCheckCircle size={22} /> Module Completed
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="d-flex gap-3 mt-4 pt-3 border-top">
              {prevWeek && (
                <button
                  onClick={() => nav(`/course/${id}/week/${prevWeek.weekNumber}`)}
                  className="btn btn-sm btn-secondary"
                >
                  <MdArrowBack /> Week {prevWeek.weekNumber}
                </button>
              )}
              {nextWeek && (
                <button
                  onClick={() => nav(`/course/${id}/week/${nextWeek.weekNumber}`)}
                  className="btn btn-sm btn-primary"
                >
                  Week {nextWeek.weekNumber} <MdArrowForward />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Syllabus Playlist Sidebar */}
        {sidebarOpen && (
          <div
            className="col-12 col-lg-4 border-start p-3"
            style={{ backgroundColor: "var(--bg-surface-elevated)", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
          >
            <div className="fw-bold mb-3 small text-muted text-uppercase letter-spacing">
              Course Playlist
            </div>

            <div className="d-flex flex-column gap-2">
              {allWeeks.map((w) => {
                const isCurrent = w.weekNumber === currentWeekNum;
                const isDone = enrollment?.completedWeeks?.includes(w.weekNumber);

                return (
                  <div
                    key={w._id}
                    onClick={() => nav(`/course/${id}/week/${w.weekNumber}`)}
                    className="p-3 rounded-3"
                    style={{
                      cursor: "pointer",
                      backgroundColor: isCurrent ? "var(--brand-primary-subtle)" : "var(--bg-surface)",
                      border: isCurrent ? "1.5px solid var(--brand-primary)" : "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        {isDone ? (
                          <MdCheckCircle size={18} className="text-success" />
                        ) : (
                          <MdPlayCircle size={18} style={{ color: isCurrent ? "var(--brand-primary)" : "var(--text-muted)" }} />
                        )}
                        <span className={`small ${isCurrent ? "fw-bold" : ""}`}>
                          Week {w.weekNumber}: {w.title}
                        </span>
                      </div>
                      <span className="badge-pill badge-primary">
                        +{w.bonusXP} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {xpModal && (
          <div className="ud-modal-backdrop">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="ud-modal-content text-center p-4"
              style={{ maxWidth: 440 }}
            >
              <div
                className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
                style={{ width: 64, height: 64, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}
              >
                <RiTrophyLine size={32} />
              </div>
              <h4 className="fw-bold mb-2">Week Completed!</h4>
              <p className="text-secondary small mb-4">
                You earned <strong>+{xpModal.xp} XP</strong> towards your Yogashrini mastery certification.
              </p>
              {xpModal.bonusUnlocked && (
                <div className="alert alert-warning py-2 mb-3 small rounded-3">
                  Bonus Content Unlocked!
                </div>
              )}
              <button className="btn btn-primary w-100" onClick={() => setXpModal(null)}>
                Continue Practice
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeekPlayer;
