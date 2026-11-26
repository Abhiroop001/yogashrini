// Frontend/src/pages/UserDashboard.tsx
// Compact Animated Yogashrini Student Dashboard
// Strictly Zero Emojis - Powered by react-icons, Framer Motion, MarkdownView & AuthContext

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./UserDashboard.css";
import Yoga from "./Yogashrini.jpg";
import { useAuth } from "../AuthContext";
import { authFetch } from "../utils/api";
import MarkdownView from "../components/MarkdownView";
import DailyRoutineTracker from "../components/DailyRoutineTracker";

import { GiLotus, GiMeditation, GiYinYang } from "react-icons/gi";
import {
  MdPeople,
  MdStar,
  MdLocationOn,
  MdSchool,
  MdAutoAwesome,
  MdAssessment,
  MdHealthAndSafety,
  MdFitnessCenter,
  MdCheckCircle,
  MdWarning,
  MdClose,
  MdPrint,
  MdVideocam,
  MdArrowForward,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import { FaLeaf } from "react-icons/fa";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, icon, action, className = "" }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    whileHover={{ y: -2 }}
    transition={{ duration: 0.25 }}
    className={`ud-card ${className}`}
  >
    <div className="ud-card-header">
      <div className="d-flex align-items-center gap-2">
        <div className="ud-card-icon">{icon}</div>
        <h3 className="m-0 fs-5 fw-bold">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="ud-card-body">{children}</div>
  </motion.section>
);

const UserDashboard: React.FC = () => {
  const { user } = useAuth();

  // State for AI Report Generator Modal
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>(user?.name || "Practitioner");
  const [targetGoal, setTargetGoal] = useState<string>("Spinal Alignment and Core Stability");
  const [experienceLevel, setExperienceLevel] = useState<string>("Intermediate");
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Sync student name when user logs in
  useEffect(() => {
    if (user?.name) setStudentName(user.name);
  }, [user?.name]);

  // State for AI Routine Generator
  const [routineDuration, setRoutineDuration] = useState<string>("20");
  const [routineFocus, setRoutineFocus] = useState<string>("Spine Elongation and Hip Flexibility");
  const [routineEnergy, setRoutineEnergy] = useState<string>("Moderate");
  const [routineLoading, setRoutineLoading] = useState<boolean>(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<string | null>(null);
  const [routineExpanded, setRoutineExpanded] = useState<boolean>(true);

  // State for Contraindication Scanner
  const [healthCondition, setHealthCondition] = useState<string>("");
  const [safetyLoading, setSafetyLoading] = useState<boolean>(false);
  const [safetyResult, setSafetyResult] = useState<string | null>(null);
  const [safetyExpanded, setSafetyExpanded] = useState<boolean>(true);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setGeneratedReport(null);
    try {
      const resp = await authFetch("/ai/generate-report", {
        method: "POST",
        body: JSON.stringify({
          studentName,
          experienceLevel,
          targetGoal,
          overallAlignmentScore: 92,
          holdStreakSeconds: 18,
          postureMetrics: {
            vrikshasana_standing_knee_deg: 178,
            vrikshasana_bent_knee_deg: 48,
            torso_tilt_deg: 4,
          },
        }),
      });
      const data = await resp.json();
      if (data.success && data.report) {
        setGeneratedReport(data.report);
      }
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateRoutine = async () => {
    setRoutineLoading(true);
    try {
      const resp = await authFetch("/ai/generate-routine", {
        method: "POST",
        body: JSON.stringify({
          durationMinutes: Number(routineDuration),
          focusArea: routineFocus,
          experienceLevel,
          energyLevel: routineEnergy,
        }),
      });
      const data = await resp.json();
      if (data.success && (data.data?.routine || data.routine)) {
        setGeneratedRoutine(data.data?.routine || data.routine);
        setRoutineExpanded(true);
      }
    } catch (err) {
      console.error("Routine generation failed:", err);
    } finally {
      setRoutineLoading(false);
    }
  };

  const handleCheckSafety = async () => {
    if (!healthCondition.trim()) return;
    setSafetyLoading(true);
    try {
      const resp = await authFetch("/ai/contraindication-check", {
        method: "POST",
        body: JSON.stringify({
          condition: healthCondition,
          intendedAsanas: ["Vrikshasana", "Adho Mukha Svanasana"],
        }),
      });
      const data = await resp.json();
      if (data.success && (data.data?.safetyAudit || data.safety_evaluation)) {
        setSafetyResult(data.data?.safetyAudit || data.safety_evaluation);
        setSafetyExpanded(true);
      }
    } catch (err) {
      console.error("Safety check failed:", err);
    } finally {
      setSafetyLoading(false);
    }
  };

  return (
    <div className="ud-page-wrapper">
      {/* COMPACT RESPONSIVE SPLIT HERO */}
      <header className="ud-hero-section">
        <div className="yoga-container">
          <div className="ud-hero-split">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="ud-hero-lead-col"
            >
              <img src={Yoga} alt="Yogashrini" className="ud-brand-emblem" />
              <div>
                <h1 className="ud-hero-headline">YOGASHRINI YOGA SCHOOL</h1>
                <p className="ud-hero-description mb-3">
                  A sanctuary for self-discovery integrating classical yogic lineages with real-time computer vision movement intelligence.
                </p>
                <div className="ud-hero-actions-row">
                  <Link className="btn btn-primary btn-sm" to="/live-trainer">
                    <MdVideocam size={17} /> Live AI Pose Trainer
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setReportModalOpen(true)}
                  >
                    <MdAssessment size={17} /> Generate AI Wellness Report
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
            >
              <div className="ud-stats-glass-card">
                <div className="ud-stats-header mb-2 pb-2">
                  <GiLotus size={28} style={{ color: "var(--brand-primary)" }} />
                  <div>
                    <h4 className="m-0 fs-6 fw-bold">Yogashrini Platform</h4>
                    <div className="small text-muted">Authentic · Inclusive · Rigorous</div>
                  </div>
                </div>

                <div className="ud-stats-grid">
                  <div className="ud-stat-item">
                    <div className="ud-stat-number">10+</div>
                    <div className="ud-stat-label">Years Mastery</div>
                  </div>
                  <div className="ud-stat-item">
                    <div className="ud-stat-number">48</div>
                    <div className="ud-stat-label">Asana Index</div>
                  </div>
                  <div className="ud-stat-item">
                    <div className="ud-stat-number">84.9%</div>
                    <div className="ud-stat-label">CV Accuracy</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="yoga-container">
        {/* AI INTELLIGENCE SUITE BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="ud-ai-suite-banner mb-3"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="ud-ai-badge-icon">
              <MdAutoAwesome size={22} />
            </div>
            <div>
              <h4 className="m-0 fs-6 fw-bold">Yogashrini Movement Intelligence Suite</h4>
              <p className="m-0 text-muted small">
                Clinical biomechanical diagnostics, adaptive sequence synthesis, and anatomical safety scanning.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setReportModalOpen(true)}
          >
            <MdAssessment size={16} /> Request Clinical Assessment
          </button>
        </motion.div>

        {/* WEIGHT / HEIGHT METABOLIC DIET & ASANA DAILY ROUTINE TRACKER */}
        <DailyRoutineTracker
          studentName={user?.name || "Practitioner"}
          userKey={user?.id || user?._id || "guest"}
        />

        {/* TWO-COLUMN INTERACTIVE AI MODULES (aligned to top so cards never stretch into dead space) */}
        <div className="row g-3 mb-3 align-items-start">
          {/* Module 1: Daily Routine Protocol Synthesizer */}
          <div className="col-12 col-lg-6">
            <SectionCard
              title="AI Daily Practice Synthesizer"
              icon={<MdFitnessCenter size={20} style={{ color: "var(--brand-primary)" }} />}
              className="mb-0"
            >
              <p className="text-muted small mb-2">
                Construct a customized sequence tailored to your physiological state, duration, and somatic focus.
              </p>
              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-4">
                  <label htmlFor="ud-routine-duration" className="form-label small fw-bold mb-1">
                    Duration
                  </label>
                  <select
                    id="ud-routine-duration"
                    name="routineDuration"
                    className="form-select form-select-sm"
                    value={routineDuration}
                    onChange={(e) => setRoutineDuration(e.target.value)}
                  >
                    <option value="15">15 Minutes</option>
                    <option value="20">20 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                  </select>
                </div>
                <div className="col-12 col-sm-4">
                  <label htmlFor="ud-routine-focus" className="form-label small fw-bold mb-1">
                    Focus Area
                  </label>
                  <select
                    id="ud-routine-focus"
                    name="routineFocus"
                    className="form-select form-select-sm"
                    value={routineFocus}
                    onChange={(e) => setRoutineFocus(e.target.value)}
                  >
                    <option value="Spine Elongation and Hip Flexibility">Spine & Hips</option>
                    <option value="Balance and Proprioception Mastery">Balance & Focus</option>
                    <option value="Nervous System Parasympathetic Reset">Stress Reset</option>
                    <option value="Core Stability and Lower Kinetic Chain">Core & Legs</option>
                  </select>
                </div>
                <div className="col-12 col-sm-4">
                  <label htmlFor="ud-routine-energy" className="form-label small fw-bold mb-1">
                    Energy
                  </label>
                  <select
                    id="ud-routine-energy"
                    name="routineEnergy"
                    className="form-select form-select-sm"
                    value={routineEnergy}
                    onChange={(e) => setRoutineEnergy(e.target.value)}
                  >
                    <option value="Gentle">Gentle</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Dynamic">Dynamic</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm w-100"
                onClick={handleGenerateRoutine}
                disabled={routineLoading}
              >
                <MdAutoAwesome size={15} />
                {routineLoading ? "Synthesizing Practice Protocol..." : "Generate Custom Sequence"}
              </button>

              <AnimatePresence>
                {generatedRoutine && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="d-flex align-items-center gap-1 text-primary fw-bold small">
                        <MdCheckCircle size={15} /> Prescribed Practice Protocol
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm py-0 px-2"
                        onClick={() => setRoutineExpanded((v) => !v)}
                      >
                        {routineExpanded ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
                        {routineExpanded ? "Collapse" : "Expand"}
                      </button>
                    </div>
                    {routineExpanded && (
                      <div className="ud-ai-result-box">
                        <MarkdownView content={generatedRoutine} compact />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </SectionCard>
          </div>

          {/* Module 2: Contraindication Safety Scanner */}
          <div className="col-12 col-lg-6">
            <SectionCard
              title="Contraindication & Safety Scanner"
              icon={<MdHealthAndSafety size={20} style={{ color: "var(--brand-primary)" }} />}
              className="mb-0"
            >
              <p className="text-muted small mb-2">
                Evaluate prospective asana sequences against musculoskeletal symptoms or health conditions.
              </p>
              <div className="mb-2">
                <label htmlFor="ud-safety-condition" className="form-label small fw-bold mb-1">
                  Enter Symptom or Medical Condition
                </label>
                <div className="input-group input-group-sm">
                  <input
                    id="ud-safety-condition"
                    name="healthCondition"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Lumbar disc herniation, Knee pain..."
                    value={healthCondition}
                    onChange={(e) => setHealthCondition(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckSafety()}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCheckSafety}
                    disabled={safetyLoading || !healthCondition.trim()}
                  >
                    {safetyLoading ? "Auditing..." : "Audit Safety"}
                  </button>
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap mb-1">
                <button
                  type="button"
                  className="badge-pill badge-primary border-0"
                  style={{ cursor: "pointer" }}
                  onClick={() => setHealthCondition("Lower back pain")}
                >
                  Lower back pain
                </button>
                <button
                  type="button"
                  className="badge-pill badge-primary border-0"
                  style={{ cursor: "pointer" }}
                  onClick={() => setHealthCondition("Knee ligament strain")}
                >
                  Knee strain
                </button>
                <button
                  type="button"
                  className="badge-pill badge-primary border-0"
                  style={{ cursor: "pointer" }}
                  onClick={() => setHealthCondition("Carpal tunnel syndrome")}
                >
                  Carpal tunnel
                </button>
              </div>

              <AnimatePresence>
                {safetyResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="d-flex align-items-center gap-1 text-danger fw-bold small">
                        <MdWarning size={15} /> Clinical Safety Evaluation
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm py-0 px-2"
                        onClick={() => setSafetyExpanded((v) => !v)}
                      >
                        {safetyExpanded ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
                        {safetyExpanded ? "Collapse" : "Expand"}
                      </button>
                    </div>
                    {safetyExpanded && (
                      <div className="ud-ai-result-box">
                        <MarkdownView content={safetyResult} compact />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </SectionCard>
          </div>
        </div>

        {/* COMPACT INSTITUTIONAL BENTO ROW 1: Offerings + Teacher Training + Studio */}
        <div className="grid-3 mb-3">
          <SectionCard title="Curricular Offerings" icon={<FaLeaf size={18} style={{ color: "var(--brand-primary)" }} />} className="mb-0">
            <ul className="text-secondary ps-3 m-0 small">
              <li className="mb-1">Daily classical Hatha & Vinyasa flows</li>
              <li className="mb-1">Weekend retreats & anatomical workshops</li>
              <li className="mb-1">200-Hour Yoga Alliance Teacher Training</li>
              <li>Real-time Computer Vision pose coaching</li>
            </ul>
          </SectionCard>

          <SectionCard title="Teacher Training & Props" icon={<MdSchool size={20} style={{ color: "var(--brand-primary)" }} />} className="mb-0">
            <p className="text-secondary small mb-3">
              Flagship training programs and authentic cork mats, bolsters, and study materials built with classical pedagogy.
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <Link className="btn btn-outline btn-sm" to="/courses">
                Browse Courses <MdArrowForward size={14} />
              </Link>
              <Link className="btn btn-secondary btn-sm" to="/training">
                Wellness Store
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Facilities & Philosophy" icon={<MdLocationOn size={20} style={{ color: "var(--brand-primary)" }} />} className="mb-0">
            <ul className="text-secondary ps-3 m-0 small">
              <li className="mb-1">Natural-light practice shala & silent garden</li>
              <li className="mb-1">Eco-certified props, straps, and blocks</li>
              <li>Lineage meets kinesiological safety science</li>
            </ul>
          </SectionCard>
        </div>

        {/* COMPACT INSTITUTIONAL BENTO ROW 2: Values + Mentors */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-lg-6">
            <SectionCard title="Core Institutional Values" icon={<GiYinYang size={20} style={{ color: "var(--brand-primary)" }} />} className="mb-0 h-100">
              <div className="table-responsive">
                <table className="values-table" style={{ marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th>Principle</th>
                      <th>Application</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Authenticity</td><td>Traditional Hatha, Vinyasa, and Patanjali lineage.</td></tr>
                    <tr><td>Inclusivity</td><td>Individualized modifications for all body types.</td></tr>
                    <tr><td>Scientific Rigor</td><td>33-point skeletal tracking & kinematic scoring.</td></tr>
                    <tr><td>Growth</td><td>Integrates Pranayama and meditative Dharana.</td></tr>
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          <div className="col-12 col-lg-6 d-flex flex-column gap-3">
            <SectionCard title="Faculty Mentors" icon={<MdPeople size={20} style={{ color: "var(--brand-primary)" }} />} className="mb-0">
              <div className="teacher-list" style={{ gridTemplateColumns: "1fr" }}>
                <div className="teacher">
                  <div className="avatar">A</div>
                  <div>
                    <strong>Anjali</strong>
                    <div className="text-muted small">Classical Hatha Master · 15+ Years</div>
                  </div>
                </div>
                <div className="teacher">
                  <div className="avatar">R</div>
                  <div>
                    <strong>Ravi</strong>
                    <div className="text-muted small">Vinyasa & Respiratory Biomechanics</div>
                  </div>
                </div>
                <div className="teacher">
                  <div className="avatar">M</div>
                  <div>
                    <strong>Maya</strong>
                    <div className="text-muted small">Restorative & Somatic Mindfulness</div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <SectionCard title="Student Experience" icon={<MdStar size={20} style={{ color: "var(--brand-primary)" }} />} className="mb-0">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <blockquote className="testimonial mb-0">
                "Yogashrini provided the analytical depth and spiritual foundation I needed. The alignment feedback transformed my personal practice." – <em>Priya R.</em>
              </blockquote>
            </div>
            <div className="col-12 col-md-6">
              <blockquote className="testimonial mb-0">
                "The combination of traditional philosophy with computer vision precision sets this institution apart." – <em>Arjun D.</em>
              </blockquote>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* MODAL / MOBILE BOTTOM SHEET: SMART AI CLINICAL ASSESSMENT REPORT */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="ud-modal-backdrop">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="ud-modal-content"
            >
              <div className="ud-modal-header">
                <div className="d-flex align-items-center gap-2">
                  <MdAssessment size={22} style={{ color: "var(--brand-accent)" }} />
                  <h4 className="m-0 fs-6 fw-bold">AI Biomechanical & Wellness Assessment</h4>
                </div>
                <button
                  type="button"
                  className="ud-modal-close-btn"
                  onClick={() => setReportModalOpen(false)}
                  aria-label="Close assessment dialog"
                >
                  <MdClose size={22} />
                </button>
              </div>

              <div className="ud-modal-body">
                {!generatedReport ? (
                  <div>
                    <p className="text-muted small mb-4">
                      Generate a clinical-grade evaluation summarizing your posture alignment accuracy,
                      kinetic chain stability, anatomical contraindications, and a 30-day adaptive protocol.
                    </p>

                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-4">
                        <label htmlFor="ud-modal-name" className="form-label small fw-bold">Student Name</label>
                        <input
                          id="ud-modal-name"
                          name="studentName"
                          type="text"
                          className="form-control"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label htmlFor="ud-modal-exp" className="form-label small fw-bold">Experience Level</label>
                        <select
                          id="ud-modal-exp"
                          name="experienceLevel"
                          className="form-select"
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-4">
                        <label htmlFor="ud-modal-goal" className="form-label small fw-bold">Primary Target Goal</label>
                        <select
                          id="ud-modal-goal"
                          name="targetGoal"
                          className="form-select"
                          value={targetGoal}
                          onChange={(e) => setTargetGoal(e.target.value)}
                        >
                          <option value="Spinal Alignment and Core Stability">Spine & Core</option>
                          <option value="Unilateral Balance and Joint Stability">Balance & Joints</option>
                          <option value="Hip Abduction and Pelvic Symmetry">Hips & Pelvis</option>
                          <option value="Cardiopulmonary and Thoracic Mobility">Chest & Breath</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-center py-2">
                      <button
                        type="button"
                        className="btn btn-primary px-4 py-2"
                        onClick={handleGenerateReport}
                        disabled={reportLoading}
                      >
                        <MdAutoAwesome size={18} />
                        {reportLoading ? "Analyzing Kinematics with AI..." : "Generate Official Report"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                      <div>
                        <h4 className="m-0 fs-6 fw-bold">YOGASHRINI CLINICAL REPORT</h4>
                        <div className="small text-muted">
                          Report ID: {generatedReport.report_id || "YOG-8472"} · Date: {new Date().toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => window.print()}
                      >
                        <MdPrint size={16} /> Print PDF
                      </button>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-bold" style={{ color: "var(--brand-primary)" }}>1. Student Profile & Somatic Overview</h6>
                      <p className="small text-secondary m-0">{generatedReport.student_overview || "Practitioner evaluated across standing balance and kinetic stability."}</p>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <div className="p-3 bg-surface rounded border">
                          <div className="fw-bold small text-muted">Stability Index</div>
                          <div className="fs-3 fw-bold text-success">
                            {generatedReport.stability_index?.score ?? 92}%
                          </div>
                          <div className="small text-muted">
                            Rating: <strong>{generatedReport.stability_index?.rating ?? "Exemplary"}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="p-3 bg-surface rounded border">
                          <div className="fw-bold small text-muted">Kinematic Alignment</div>
                          <div className="small text-secondary mt-1">
                            Standing Knee: <strong>178 deg (Normal)</strong><br />
                            Pelvic Abduction: <strong>48 deg (Optimal)</strong><br />
                            Spine Deviation: <strong>Under 5 deg</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-bold" style={{ color: "var(--brand-primary)" }}>2. Musculoskeletal Assessment</h6>
                      <p className="small text-secondary m-0">{generatedReport.clinical_assessment || "No structural joint deviations detected."}</p>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-bold text-danger">3. Precautions & Contraindications</h6>
                      <div className="p-2 rounded border-start border-danger border-4 small text-danger" style={{ background: "rgba(239, 68, 68, 0.08)" }}>
                        {generatedReport.contraindications_and_precautions || "Maintain focus on knee safety: avoid placing foot on the knee joint."}
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setGeneratedReport(null)}
                      >
                        Generate Another
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setReportModalOpen(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDashboard;
