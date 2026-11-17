import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../inc/Navbar";
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
  const [week, setWeek] = useState<WeekData | null>(null);
  const [activeVideo, setActiveVideo] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [showReward, setShowReward] = useState<boolean>(false);
  const [enrollment, setEnrollment] = useState<EnrollmentStatus | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const userId = localStorage.getItem("userId") || null;

  useEffect(() => {
    if (!id || !weekNum) return;

    Promise.all([
      fetch(`${API}/course/${id}`).then((r) => r.json()),
      fetch(`${API}/course/${id}/weeks`).then((r) => r.json()),
    ]).then(([cd, wd]) => {
      setCourse(cd.course);
      const ws: WeekData[] = wd.weeks || [];
      setAllWeeks(ws);
      const current = ws.find((w) => w.weekNumber === Number(weekNum));
      setWeek(current || null);
    });

    if (userId) {
      fetch(`${API}/payment/enrollment/check/${id}?userId=${userId}`)
        .then((r) => r.json())
        .then((d) => {
          if (!d.enrolled) {
            nav(`/course/${id}`);
            return;
          }
          setEnrollment(d.enrollment);
          if (d.enrollment?.completedWeeks?.includes(Number(weekNum))) {
            setCompleted(true);
          }
        });
    } else {
      nav(`/course/${id}`);
    }
  }, [id, weekNum, nav, userId]);

  const handleComplete = async () => {
    if (completed || !userId || !id || !weekNum) return;
    const r = await fetch(`${API}/payment/enrollment/complete-week`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId: id, weekNumber: Number(weekNum) }),
    });
    const data = await r.json();
    if (r.ok) {
      setCompleted(true);
      setEnrollment(data.enrollment);
      setShowReward(true);
    }
  };

  const regularWeeks = allWeeks.filter((w) => !w.isBonus).sort((a, b) => a.weekNumber - b.weekNumber);
  const prevWeek = regularWeeks.find((w) => w.weekNumber === Number(weekNum) - 1);
  const nextWeek = regularWeeks.find((w) => w.weekNumber === Number(weekNum) + 1);
  const bonusWeeks = allWeeks.filter((w) => w.isBonus);

  if (!week) {
    return (
      <>
        <Navbar />
        <div className="text-center py-5 my-5 text-muted">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 small">Loading training lesson...</p>
        </div>
      </>
    );
  }

  const currentVideo = week.videos[activeVideo];
  const isAlreadyCompleted = Boolean(enrollment?.completedWeeks?.includes(Number(weekNum)));
  const completedWeeks = enrollment?.completedWeeks || [];

  return (
    <>
      <Navbar />
      <div
        className="min-vh-100 d-flex flex-column"
        style={{ backgroundColor: "#0f0f1a", fontFamily: "'Inter', sans-serif" }}
      >
        {/* Reward celebration modal */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75"
              style={{ zIndex: 9999 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-4 p-5 text-center shadow-lg"
                style={{ maxWidth: 420, width: "90%" }}
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 30 }}
              >
                <div className="mb-3 text-warning">
                  <RiTrophyLine size={64} />
                </div>
                <h3 className="fw-bold mb-2 text-dark">Week Completed!</h3>
                <p className="text-muted small mb-4">{week.title}</p>

                <div className="d-flex justify-content-center gap-3 mb-4">
                  <div className="bg-light p-3 rounded-3">
                    <div className="fs-4 fw-bold text-primary">+{week.bonusXP}</div>
                    <div className="text-muted small">XP Earned</div>
                  </div>
                  <div className="bg-light p-3 rounded-3">
                    <div className="fs-4 fw-bold text-warning">+{week.bonusPoints}</div>
                    <div className="text-muted small">Points</div>
                  </div>
                  <div className="bg-light p-3 rounded-3">
                    <div className="fs-4 fw-bold text-success">{enrollment?.totalXP || 0}</div>
                    <div className="text-muted small">Total XP</div>
                  </div>
                </div>

                {enrollment?.bonusUnlocked && (
                  <div className="alert alert-warning py-2 px-3 rounded-3 small mb-4 d-flex align-items-center justify-content-center gap-2">
                    <MdStar className="text-warning" size={20} />
                    <strong>Bonus Week Unlocked!</strong> You've completed all curriculum modules.
                  </div>
                )}

                <div className="d-flex gap-2 justify-content-center">
                  {nextWeek && (
                    <button
                      onClick={() => {
                        setShowReward(false);
                        nav(`/course/${id}/week/${nextWeek.weekNumber}`);
                      }}
                      className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
                    >
                      Next Week <MdArrowForward />
                    </button>
                  )}
                  <button
                    onClick={() => setShowReward(false)}
                    className="btn btn-outline-secondary rounded-pill px-4"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Control Bar */}
        <div
          className="d-flex align-items-center justify-content-between px-4 py-2 border-bottom"
          style={{ backgroundColor: "#1a1a2e", borderColor: "#2d2d45" }}
        >
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => nav(`/course/${id}`)}
              className="btn btn-sm btn-outline-light rounded-pill d-flex align-items-center gap-1"
            >
              <MdArrowBack /> Back to Course
            </button>
            <div className="text-light small">
              <span className="badge bg-primary rounded-pill me-2">Week {week.weekNumber}</span>
              {week.isBonus && <span className="badge bg-warning text-dark rounded-pill me-2">BONUS</span>}
              <span className="fw-semibold">{week.title}</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-dark border border-secondary text-light px-3 py-2 rounded-pill small d-flex align-items-center gap-1">
              <RiAwardLine className="text-warning" /> {enrollment?.totalXP || 0} XP
            </span>
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="btn btn-sm btn-outline-secondary rounded-3 text-light"
              title="Toggle Syllabus"
            >
              <MdList size={20} />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="d-flex flex-grow-1 overflow-hidden">
          {/* Video Player */}
          <div className="flex-grow-1 d-flex flex-column overflow-auto">
            <div className="bg-black position-relative text-center">
              {currentVideo ? (
                <video
                  ref={videoRef}
                  src={`${API}/videos/${currentVideo.filename}`}
                  controls
                  className="w-100"
                  style={{ maxHeight: "65vh", objectFit: "contain" }}
                  onEnded={() => {
                    if (activeVideo < week.videos.length - 1) {
                      setActiveVideo((v) => v + 1);
                    }
                  }}
                />
              ) : (
                <div
                  className="w-100 d-flex flex-column align-items-center justify-content-center text-muted py-5"
                  style={{ height: "400px" }}
                >
                  <MdPlayCircle size={64} className="mb-2 opacity-50" />
                  <p className="small">No videos available for this week</p>
                </div>
              )}
            </div>

            {/* Video Meta Info */}
            <div className="p-4" style={{ backgroundColor: "#1a1a2e" }}>
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                  <h4 className="text-white fw-bold mb-1">{currentVideo?.title || week.title}</h4>
                  {currentVideo?.description && (
                    <p className="text-muted small mb-0">{currentVideo.description}</p>
                  )}
                </div>

                <div>
                  {!isAlreadyCompleted && !completed ? (
                    <button
                      onClick={handleComplete}
                      className="btn btn-success rounded-pill px-4 d-flex align-items-center gap-2 fw-bold shadow-sm"
                    >
                      <MdCheckCircle /> Mark Complete (+{week.bonusXP} XP)
                    </button>
                  ) : (
                    <div className="d-flex align-items-center gap-2 text-success fw-bold">
                      <MdCheckCircle size={22} /> Completed
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Between Weeks */}
              <div className="d-flex gap-3 mt-4 pt-3 border-top border-secondary border-opacity-25">
                {prevWeek && (
                  <button
                    onClick={() => nav(`/course/${id}/week/${prevWeek.weekNumber}`)}
                    className="btn btn-sm btn-outline-light rounded-pill px-3 d-flex align-items-center gap-1"
                  >
                    <MdArrowBack /> Week {prevWeek.weekNumber}
                  </button>
                )}
                {nextWeek && (
                  <button
                    onClick={() => nav(`/course/${id}/week/${nextWeek.weekNumber}`)}
                    className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                  >
                    Week {nextWeek.weekNumber} <MdArrowForward />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Playlist */}
          {sidebarOpen && (
            <div
              className="border-start overflow-auto"
              style={{
                width: 320,
                backgroundColor: "#16213e",
                borderColor: "#2d2d45",
              }}
            >
              <div className="p-3 border-bottom border-secondary border-opacity-25">
                <div className="text-white fw-bold small">{course?.title || "Course Outline"}</div>
                <div className="text-muted small mt-1">
                  {completedWeeks.length}/{regularWeeks.length} weeks completed
                </div>
                <div className="progress mt-2" style={{ height: "4px" }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{
                      width: `${Math.round(
                        (completedWeeks.length / (regularWeeks.length || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Weeks List */}
              <div className="py-2">
                {regularWeeks.map((w) => {
                  const isCurrent = w.weekNumber === Number(weekNum);
                  const isDone = completedWeeks.includes(w.weekNumber);

                  return (
                    <div
                      key={w._id}
                      onClick={() => nav(`/course/${id}/week/${w.weekNumber}`)}
                      className={`px-3 py-2 cursor-pointer transition ${
                        isCurrent ? "bg-primary bg-opacity-25 border-start border-3 border-primary" : ""
                      }`}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center small fw-bold text-white ${
                            isDone ? "bg-success" : isCurrent ? "bg-primary" : "bg-secondary"
                          }`}
                          style={{ width: 24, height: 24, fontSize: 11 }}
                        >
                          {isDone ? <MdCheckCircle /> : w.weekNumber}
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className={`small fw-semibold text-truncate ${isCurrent ? "text-primary" : "text-light"}`}>
                            {w.title}
                          </div>
                          <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                            {w.videos.length} videos - {w.bonusXP} XP
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Videos within current week */}
              {week.videos.length > 1 && (
                <div className="border-top border-secondary border-opacity-25 pt-2">
                  <div className="px-3 py-1 text-muted small fw-bold" style={{ fontSize: "0.75rem" }}>
                    CURRENT MODULE PLAYLIST
                  </div>
                  {week.videos.map((v, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveVideo(idx)}
                      className={`px-3 py-2 d-flex align-items-center gap-2 cursor-pointer ${
                        idx === activeVideo ? "bg-primary bg-opacity-20 text-white" : "text-muted"
                      }`}
                      style={{ cursor: "pointer" }}
                    >
                      <MdPlayCircle
                        className={idx === activeVideo ? "text-primary" : "text-secondary"}
                        size={18}
                      />
                      <span className="small text-truncate">{v.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WeekPlayer;
