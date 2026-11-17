import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
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

  const userId = localStorage.getItem("userId") || null;

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API}/course/${id}`).then((r) => r.json()),
      fetch(`${API}/course/${id}/weeks`).then((r) => r.json()),
    ])
      .then(([cd, wd]) => {
        setCourse(cd.course);
        setWeeks(wd.weeks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (userId) {
      fetch(`${API}/payment/enrollment/check/${id}?userId=${userId}`)
        .then((r) => r.json())
        .then((d) => {
          setEnrolled(d.enrolled);
          setEnrollment(d.enrollment);
        })
        .catch(() => {});
    }
  }, [id, userId]);

  const handleEnroll = async () => {
    if (!userId) {
      return nav("/login");
    }

    setPayLoading(true);
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
      <>
        <Navbar />
        <div className="text-center py-5 my-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2 small">Loading course details...</p>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <div className="text-center py-5 my-5">
          <h4>Course not found</h4>
          <button className="btn btn-primary rounded-pill px-4 mt-3" onClick={() => nav("/courses")}>
            Browse Courses
          </button>
        </div>
      </>
    );
  }

  const regularWeeks = weeks.filter((w) => !w.isBonus).sort((a, b) => a.weekNumber - b.weekNumber);
  const bonusWeeks = weeks.filter((w) => w.isBonus);
  const completedNums = enrollment?.completedWeeks || [];
  const totalXP =
    regularWeeks.reduce((s, w) => s + (w.bonusXP || 0), 0) +
    bonusWeeks.reduce((s, w) => s + (w.bonusXP || 0), 0);

  return (
    <>
      <Navbar />
      <div className="min-vh-100 bg-light">
        {/* Hero Section */}
        <div className="bg-dark text-white py-5">
          <div className="container">
            <div className="row g-4 align-items-center">
              <div className="col-12 col-lg-7">
                <button
                  onClick={() => nav("/courses")}
                  className="btn btn-sm btn-outline-light rounded-pill mb-3 d-inline-flex align-items-center gap-1"
                >
                  <MdArrowBack /> All Courses
                </button>
                <h1 className="fw-bold mb-3">{course.title}</h1>
                <p className="text-light text-opacity-75 mb-4 lead fs-6">{course.description}</p>
                <div className="d-flex gap-3 flex-wrap small text-light text-opacity-90">
                  <span className="d-flex align-items-center gap-1">
                    <MdSchool className="text-primary" /> {course.level}
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <MdAccessTime className="text-success" /> {course.totalWeeks || regularWeeks.length} Weeks
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <RiAwardLine className="text-warning" /> Up to {totalXP} XP
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <MdStar className="text-warning" /> {bonusWeeks.length} Bonus Week{bonusWeeks.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Enrollment Card */}
              <div className="col-12 col-lg-5">
                <motion.div
                  className="card border-0 rounded-4 shadow-lg p-4 bg-white text-dark"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {course.thumbnail ? (
                    <img
                      src={`${API}/thumbnails/${course.thumbnail}`}
                      alt={course.title}
                      className="w-100 rounded-3 mb-3 object-fit-cover"
                      style={{ height: "180px" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="w-100 rounded-3 mb-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary"
                      style={{ height: "180px" }}
                    >
                      <MdSchool size={64} />
                    </div>
                  )}

                  {msg && (
                    <div
                      className={`alert alert-${msg.type} py-2 px-3 rounded-3 small mb-3`}
                      role="alert"
                    >
                      {msg.text}
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-baseline mb-2">
                    <span className="fs-3 fw-bold text-dark">
                      {course.price === 0 ? "Complimentary" : `INR ${course.price}`}
                    </span>
                    <span className="badge bg-light text-muted border">Lifetime Access</span>
                  </div>

                  {enrolled ? (
                    <button
                      onClick={() => nav(`/course/${id}/week/1`)}
                      className="btn btn-success w-100 py-3 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 mb-3 shadow-sm"
                    >
                      <MdPlayCircle size={20} /> Continue Learning
                    </button>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={payLoading}
                      className="btn btn-primary w-100 py-3 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 mb-3 shadow-sm"
                    >
                      <RiShieldCheckLine size={20} />
                      {payLoading ? "Processing..." : course.price === 0 ? "Enroll Complimentary" : "Enroll Now"}
                    </button>
                  )}

                  <div className="d-flex flex-column gap-2 small text-muted pt-2 border-top">
                    <div className="d-flex align-items-center gap-2">
                      <MdPlayCircle className="text-primary" />
                      {weeks.reduce((s, w) => s + (w.videos ? w.videos.length : 0), 0)} video lessons
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <RiAwardLine className="text-primary" />
                      Earn up to {totalXP} XP
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <RiCoinsLine className="text-primary" />
                      Bonus points rewards
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <MdStar className="text-primary" />
                      {bonusWeeks.length > 0 ? "Bonus modules included" : "Certificate on completion"}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Syllabus Section */}
        <div className="container py-5">
          <h3 className="fw-bold mb-4 text-dark">Course Curriculum</h3>

          {/* Regular Weeks */}
          <div className="d-flex flex-column gap-3 mb-5">
            {regularWeeks.map((week) => {
              const isDone = completedNums.includes(week.weekNumber);
              const isLocked = !enrolled;

              return (
                <div
                  key={week._id}
                  className={`card border-0 rounded-4 shadow-sm p-3 ${
                    enrolled ? "cursor-pointer hover-lift" : ""
                  }`}
                  style={{
                    borderLeft: isDone ? "5px solid #10b981" : "5px solid var(--yoga-primary, #FF2D6F)",
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
                          backgroundColor: isDone ? "#10b981" : isLocked ? "#9ca3af" : "var(--yoga-primary, #FF2D6F)",
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
                        <div className="fw-bold text-dark d-flex align-items-center gap-2">
                          <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-1 small">
                            Week {week.weekNumber}
                          </span>
                          {week.title}
                        </div>
                        {week.description && (
                          <div className="text-muted small mt-1">{week.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-primary border rounded-pill px-3 py-2 small">
                        <RiAwardLine className="me-1" /> {week.bonusXP} XP
                      </span>
                      <span className="badge bg-light text-warning text-dark border rounded-pill px-3 py-2 small">
                        <RiCoinsLine className="me-1" /> {week.bonusPoints} pts
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

          {/* Bonus Weeks */}
          {bonusWeeks.length > 0 && (
            <div>
              <h4 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                <MdStar className="text-warning" /> Bonus Mastery Content
              </h4>
              <p className="text-muted small mb-4">
                Unlocks automatically after completing all core weeks of the curriculum.
              </p>

              <div className="d-flex flex-column gap-3">
                {bonusWeeks.map((week) => {
                  const unlocked = Boolean(enrollment?.bonusUnlocked);
                  return (
                    <div
                      key={week._id}
                      className="card border-0 rounded-4 shadow-sm p-3"
                      style={{ borderLeft: "5px solid #f59e0b" }}
                      onClick={() => unlocked && nav(`/course/${id}/week/${week.weekNumber}`)}
                    >
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white"
                            style={{
                              width: 44,
                              height: 44,
                              backgroundColor: unlocked ? "#f59e0b" : "#9ca3af",
                            }}
                          >
                            {unlocked ? <MdStar size={22} /> : <MdLock size={20} />}
                          </div>
                          <div>
                            <div className="fw-bold text-dark d-flex align-items-center gap-2">
                              <span className="badge bg-warning bg-opacity-25 text-dark rounded-pill px-2 py-1 small">
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

                        <span className="badge bg-light text-warning text-dark border rounded-pill px-3 py-2 small">
                          <RiAwardLine className="me-1" /> {week.bonusXP} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseDetail;
