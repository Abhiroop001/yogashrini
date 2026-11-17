// src/pages/CourseDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdPlayCircle,
  MdLock,
  MdCheckCircle,
  MdStar,
  MdArrowBack,
  MdSchool,
  MdAccessTime,
} from "react-icons/md";
import { RiAwardLine, RiCoinsLine, RiShieldCheckLine } from "react-icons/ri";

const API = "http://localhost:2000";

interface VideoItem {
  _id: string;
  title: string;
  url: string;
  duration?: number;
}

interface WeekItem {
  _id: string;
  weekNumber: number;
  title: string;
  description?: string;
  isBonus?: boolean;
  bonusXP: number;
  bonusPoints: number;
  videos: VideoItem[];
}

interface EnrollmentData {
  completedWeeks?: number[];
  bonusUnlocked?: boolean;
}

interface CourseData {
  _id: string;
  title: string;
  description: string;
  level: string;
  totalWeeks?: number;
  price: number;
  thumbnail?: string;
}

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [weeks, setWeeks] = useState<WeekItem[]>([]);
  const [enrolled, setEnrolled] = useState<boolean>(false);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

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
        setWeeks(wData.weeks || []);
        setEnrolled(Boolean(eData.enrolled));
        setEnrollment(eData.enrollment || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, userId]);

  const handleEnrollOrPay = async () => {
    if (!userId) {
      return nav("/login");
    }

    setPayLoading(true);
    setMsg(null);

    try {
      const r = await fetch(`${API}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: id, userId }),
      });
      const data = await r.json();

      if (data.free) {
        setEnrolled(true);
        setMsg({ type: "success", text: "Enrolled for free! Enjoy your course." });
        return nav(`/course/${id}/week/1`);
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Yogashrini",
        description: data.courseName,
        order_id: data.orderId,
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          const vr = await fetch(`${API}/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: id,
              userId,
            }),
          });
          const vdata = await vr.json();
          if (vr.ok) {
            setEnrolled(true);
            setMsg({ type: "success", text: "Payment verified successfully. Welcome to your course." });
            setTimeout(() => nav(`/course/${id}/week/1`), 1500);
          } else {
            setMsg({ type: "danger", text: vdata.error || "Payment verification failed" });
          }
        },
        prefill: { name: localStorage.getItem("uname") || "", email: "" },
        theme: { color: "#FF2D6F" },
        modal: { ondismiss: () => setPayLoading(false) },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch {
      setMsg({ type: "danger", text: "Failed to initiate payment. Please try again." });
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="yoga-container text-center py-5 my-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-2 small">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="yoga-container text-center py-5 my-5">
        <h4>Course not found</h4>
        <button className="btn btn-primary mt-3" onClick={() => nav("/courses")}>
          Browse Courses
        </button>
      </div>
    );
  }

  const regularWeeks = weeks.filter((w) => !w.isBonus).sort((a, b) => a.weekNumber - b.weekNumber);
  const bonusWeeks = weeks.filter((w) => w.isBonus);
  const completedNums = enrollment?.completedWeeks || [];
  const totalXP =
    regularWeeks.reduce((s, w) => s + (w.bonusXP || 0), 0) +
    bonusWeeks.reduce((s, w) => s + (w.bonusXP || 0), 0);

  return (
    <div className="pb-5">
      {/* Hero Header Section */}
      <div className="ud-hero-section mb-4">
        <div className="yoga-container">
          <div className="row g-4 align-items-center">
            <div className="col-12 col-lg-7">
              <button
                onClick={() => nav("/courses")}
                className="btn btn-sm btn-secondary mb-3"
              >
                <MdArrowBack /> All Courses
              </button>
              <h1 className="fw-bold mb-3 fs-2">{course.title}</h1>
              <p className="text-secondary mb-4 lead fs-6">{course.description}</p>
              <div className="d-flex gap-3 flex-wrap small text-secondary">
                <span className="badge-pill badge-primary">
                  <MdSchool /> {course.level}
                </span>
                <span className="badge-pill badge-emerald">
                  <MdAccessTime /> {course.totalWeeks || regularWeeks.length} Weeks
                </span>
                <span className="badge-pill badge-accent">
                  <RiAwardLine /> Up to {totalXP} XP
                </span>
                {bonusWeeks.length > 0 && (
                  <span className="badge-pill badge-primary">
                    <MdStar /> {bonusWeeks.length} Bonus Module{bonusWeeks.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Enrollment / Purchase Action Box */}
            <div className="col-12 col-lg-5">
              <div className="card p-4">
                <div className="d-flex align-items-baseline justify-content-between mb-3">
                  <div>
                    <span className="fs-3 fw-bold" style={{ color: "var(--brand-primary)" }}>
                      {course.price === 0 ? "Free Access" : `₹${course.price}`}
                    </span>
                    {course.price > 0 && (
                      <span className="text-muted small ms-2">Full Course Access</span>
                    )}
                  </div>
                  {enrolled && (
                    <span className="badge-pill badge-emerald">
                      <MdCheckCircle /> Enrolled
                    </span>
                  )}
                </div>

                {msg && (
                  <div className={`alert alert-${msg.type} py-2 px-3 small rounded-3 mb-3`}>
                    {msg.text}
                  </div>
                )}

                {enrolled ? (
                  <button
                    className="btn btn-primary w-100 py-3 fw-bold"
                    onClick={() => nav(`/course/${id}/week/1`)}
                  >
                    <MdPlayCircle size={20} /> Continue Learning
                  </button>
                ) : (
                  <button
                    className="btn btn-primary w-100 py-3 fw-bold"
                    onClick={handleEnrollOrPay}
                    disabled={payLoading}
                  >
                    {payLoading ? (
                      "Processing..."
                    ) : course.price === 0 ? (
                      "Enroll for Free"
                    ) : (
                      `Enroll Now · ₹${course.price}`
                    )}
                  </button>
                )}

                <div className="d-flex align-items-center justify-content-center gap-2 mt-3 text-muted small">
                  <RiShieldCheckLine size={16} /> 30-Day Guided Practice & Certification
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Curriculum Weeks */}
      <main className="yoga-container">
        <h3 className="fw-bold mb-4 fs-4">Curriculum & Video Modules</h3>

        <div className="d-flex flex-column gap-3 mb-5">
          {regularWeeks.map((week) => {
            const isDone = completedNums.includes(week.weekNumber);
            const isLocked = !enrolled;

            return (
              <div
                key={week._id}
                className="card p-3"
                style={{
                  borderLeft: isDone ? "5px solid #10b981" : "5px solid var(--brand-primary)",
                  cursor: enrolled ? "pointer" : "default",
                }}
                onClick={() => enrolled && nav(`/course/${id}/week/${week.weekNumber}`)}
              >
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white"
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: isDone ? "#10b981" : isLocked ? "var(--border-prominent)" : "var(--brand-primary)",
                      }}
                    >
                      {isDone ? (
                        <MdCheckCircle size={22} />
                      ) : isLocked ? (
                        <MdLock size={20} />
                      ) : (
                        <MdPlayCircle size={22} />
                      )}
                    </div>
                    <div>
                      <div className="fw-bold d-flex align-items-center gap-2">
                        <span className="badge-pill badge-primary">
                          Week {week.weekNumber}
                        </span>
                        {week.title}
                      </div>
                      {week.description && (
                        <div className="text-secondary small mt-1">{week.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span className="badge-pill badge-accent">
                      <RiAwardLine /> {week.bonusXP} XP
                    </span>
                    <span className="badge-pill badge-emerald">
                      <RiCoinsLine /> {week.bonusPoints} pts
                    </span>
                    <span className="text-muted small ms-2">
                      {week.videos?.length || 0} video{week.videos?.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bonus Modules */}
        {bonusWeeks.length > 0 && (
          <div>
            <h4 className="fw-bold mb-2 fs-5 d-flex align-items-center gap-2">
              <MdStar style={{ color: "var(--brand-amber)" }} /> Bonus Mastery Content
            </h4>
            <p className="text-muted small mb-3">
              Unlocks automatically after completing all core weeks of the curriculum.
            </p>

            <div className="d-flex flex-column gap-3">
              {bonusWeeks.map((week) => {
                const unlocked = Boolean(enrollment?.bonusUnlocked);
                return (
                  <div
                    key={week._id}
                    className="card p-3"
                    style={{
                      borderLeft: "5px solid var(--brand-amber)",
                      cursor: unlocked ? "pointer" : "default",
                    }}
                    onClick={() => unlocked && nav(`/course/${id}/week/${week.weekNumber}`)}
                  >
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white"
                          style={{
                            width: 44,
                            height: 44,
                            backgroundColor: unlocked ? "var(--brand-amber)" : "var(--border-prominent)",
                          }}
                        >
                          {unlocked ? <MdStar size={22} /> : <MdLock size={20} />}
                        </div>
                        <div>
                          <div className="fw-bold d-flex align-items-center gap-2">
                            <span className="badge-pill badge-primary">
                              BONUS
                            </span>
                            {week.title}
                          </div>
                          {!unlocked && (
                            <div className="text-muted small mt-1">
                              Complete all core weeks to unlock this module.
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="badge-pill badge-accent">
                        <RiAwardLine /> {week.bonusXP} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseDetail;
