// src/pages/UserDashboard.tsx
// Modernized Yogashrini Student Dashboard
// Features: AI Clinical Report Generation, Daily Practice Protocol Synthesizer,
// Contraindication Safety Scanner, and Live Trainer Quick Action
// Strictly Zero Emojis - Powered Exclusively by react-icons & Framer Motion

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./UserDashboard.css";
import Yoga from "./Yogashrini.jpg";

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
  MdArrowForward
} from "react-icons/md";
import { FaLeaf } from "react-icons/fa";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  action?: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, icon, action }) => (
  <motion.section
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
    className="ud-card"
  >
    <div className="ud-card-header">
      <div className="d-flex align-items-center gap-3">
        <div className="ud-card-icon">{icon}</div>
        <h3 className="m-0 fs-5 fw-bold">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="ud-card-body">{children}</div>
  </motion.section>
);

const UserDashboard: React.FC = () => {
  // State for AI Report Generator Modal
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>("Practitioner");
  const [targetGoal, setTargetGoal] = useState<string>("Spinal Alignment and Core Stability");
  const [experienceLevel, setExperienceLevel] = useState<string>("Intermediate");
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // State for AI Routine Generator
  const [routineDuration, setRoutineDuration] = useState<string>("20");
  const [routineFocus, setRoutineFocus] = useState<string>("Spine Elongation and Hip Flexibility");
  const [routineEnergy, setRoutineEnergy] = useState<string>("Moderate");
  const [routineLoading, setRoutineLoading] = useState<boolean>(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<string | null>(null);

  // State for Contraindication Scanner
  const [healthCondition, setHealthCondition] = useState<string>("");
  const [safetyLoading, setSafetyLoading] = useState<boolean>(false);
  const [safetyResult, setSafetyResult] = useState<string | null>(null);

  // Generate Smart Report
  const handleGenerateReport = async () => {
    setReportLoading(true);
    setGeneratedReport(null);
    try {
      const resp = await fetch("http://localhost:2000/ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          experienceLevel,
          targetGoal,
          overallAlignmentScore: 92,
          holdStreakSeconds: 18,
          postureMetrics: {
            vrikshasana_standing_knee_deg: 178,
            vrikshasana_bent_knee_deg: 48,
            torso_tilt_deg: 4
          }
        })
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

  // Generate Routine
  const handleGenerateRoutine = async () => {
    setRoutineLoading(true);
    try {
      const resp = await fetch("http://localhost:2000/ai/generate-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMinutes: Number(routineDuration),
          focusArea: routineFocus,
          experienceLevel,
          energyLevel: routineEnergy
        })
      });
      const data = await resp.json();
      if (data.success && (data.data?.routine || data.routine)) {
        setGeneratedRoutine(data.data?.routine || data.routine);
      }
    } catch (err) {
      console.error("Routine generation failed:", err);
    } finally {
      setRoutineLoading(false);
    }
  };

  // Check Contraindications
  const handleCheckSafety = async () => {
    if (!healthCondition.trim()) return;
    setSafetyLoading(true);
    try {
      const resp = await fetch("http://localhost:2000/ai/contraindication-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: healthCondition,
          intendedAsanas: ["Vrikshasana", "Adho Mukha Svanasana"]
        })
      });
      const data = await resp.json();
      if (data.success && (data.data?.safetyAudit || data.safety_evaluation)) {
        setSafetyResult(data.data?.safetyAudit || data.safety_evaluation);
      }
    } catch (err) {
      console.error("Safety check failed:", err);
    } finally {
      setSafetyLoading(false);
    }
  };

  return (
    <div className="ud-page-wrapper">
      {/* RESPONSIVE SPLIT HERO */}
      <header className="ud-hero-section">
        <div className="yoga-container">
          <div className="ud-hero-split">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="ud-hero-lead-col"
            >
              <img src={Yoga} alt="Yogashrini" className="ud-brand-emblem" />
              <div>
                <h1 className="ud-hero-headline">YOGASHRINI YOGA SCHOOL</h1>
                <p className="ud-hero-description">
                  A sanctuary for self-discovery and transformation integrating classical yogic lineages with real-time computer vision movement intelligence.
                </p>
                <div className="ud-hero-actions-row">
                  <a className="btn btn-primary" href="/live-trainer">
                    <MdVideocam size={18} /> Live AI Pose Trainer
                  </a>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setReportModalOpen(true)}
                  >
                    <MdAssessment size={18} /> Generate AI Wellness Report
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="ud-stats-glass-card">
                <div className="ud-stats-header">
                  <GiLotus size={32} style={{ color: "var(--brand-primary)" }} />
                  <div>
                    <h4 className="m-0 fs-6 fw-bold">Yogashrini Platform</h4>
                    <div className="small text-muted">Authentic · Inclusive · Rigorous</div>
                  </div>
                </div>

                <div className="ud-stats-grid">
                  <div className="ud-stat-item">
                    <div className="ud-stat-number">10+</div>
                    <div className="ud-stat-label">Years of Mastery</div>
                  </div>
                  <div className="ud-stat-item">
                    <div className="ud-stat-number">47</div>
                    <div className="ud-stat-label">Class Catalog</div>
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

      <main className="yoga-container">
        {/* AI INTELLIGENCE SUITE BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="ud-ai-suite-banner"
        >
          <div className="d-flex align-items-center gap-3">
            <div className="ud-ai-badge-icon">
              <MdAutoAwesome size={24} />
            </div>
            <div>
              <h4 className="m-0 fs-6 fw-bold">Yogashrini Movement Intelligence Suite</h4>
              <p className="m-0 text-muted small">
                Clinical biomechanical diagnostics, adaptive practice protocol synthesizer, and anatomical safety scanner.
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setReportModalOpen(true)}
          >
            <MdAssessment size={16} /> Request Clinical Assessment
          </button>
        </motion.div>

        {/* TWO-COLUMN INTERACTIVE AI MODULES */}
        <div className="row g-4 mb-4">
          {/* Module 1: Daily Routine Protocol Synthesizer */}
          <div className="col-12 col-lg-6">
            <SectionCard
              title="AI Daily Practice Synthesizer"
              icon={<MdFitnessCenter size={22} style={{ color: "var(--brand-primary)" }} />}
            >
              <p className="text-muted small">
                Dynamically construct a customized sequence tailored to your physiological state, available duration, and somatic focus.
              </p>
              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-4">
                  <label className="form-label small fw-bold">Duration</label>
                  <select
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
                  <label className="form-label small fw-bold">Focus Area</label>
                  <select
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
                  <label className="form-label small fw-bold">Energy</label>
                  <select
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
                className="btn btn-outline btn-sm w-100"
                onClick={handleGenerateRoutine}
                disabled={routineLoading}
              >
                <MdAutoAwesome size={16} />
                {routineLoading ? "Synthesizing Practice Protocol..." : "Generate Custom Sequence"}
              </button>

              {generatedRoutine && (
                <div className="ud-ai-result-box mt-3">
                  <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold small">
                    <MdCheckCircle size={16} /> Prescribed Practice Protocol
                  </div>
                  <pre className="ud-code-block">{generatedRoutine}</pre>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Module 2: Contraindication Safety Scanner */}
          <div className="col-12 col-lg-6">
            <SectionCard
              title="Contraindication & Safety Scanner"
              icon={<MdHealthAndSafety size={22} style={{ color: "var(--brand-primary)" }} />}
            >
              <p className="text-muted small">
                Evaluate prospective asana sequences against specific musculoskeletal symptoms or systemic health conditions.
              </p>
              <div className="mb-3">
                <label className="form-label small fw-bold">Enter Symptom or Medical Condition</label>
                <div className="input-group input-group-sm">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Lumbar disc herniation, Knee pain..."
                    value={healthCondition}
                    onChange={(e) => setHealthCondition(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckSafety()}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleCheckSafety}
                    disabled={safetyLoading || !healthCondition.trim()}
                  >
                    {safetyLoading ? "Auditing..." : "Audit Safety"}
                  </button>
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap mb-2">
                <span className="badge-pill badge-primary" style={{ cursor: "pointer" }} onClick={() => setHealthCondition("Lower back pain")}>Lower back pain</span>
                <span className="badge-pill badge-primary" style={{ cursor: "pointer" }} onClick={() => setHealthCondition("Knee ligament strain")}>Knee strain</span>
                <span className="badge-pill badge-primary" style={{ cursor: "pointer" }} onClick={() => setHealthCondition("Carpal tunnel syndrome")}>Carpal tunnel</span>
              </div>

              {safetyResult && (
                <div className="ud-ai-result-box mt-3">
                  <div className="d-flex align-items-center gap-2 mb-2 text-danger fw-bold small">
                    <MdWarning size={16} /> Clinical Safety Evaluation
                  </div>
                  <pre className="ud-code-block">{safetyResult}</pre>
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* CORE INSTITUTIONAL SECTIONS */}
        <SectionCard
          title="About Yogashrini Yoga School"
          icon={<GiMeditation size={24} style={{ color: "var(--brand-primary)" }} />}
        >
          <p className="text-secondary m-0">
            Yogashrini is more than a yoga school; it is a center for self-discovery, restorative movement,
            and transformation. We synthesize time-tested yogic lineage with contemporary kinesiological research.
          </p>
        </SectionCard>

        <SectionCard title="Core Institutional Values" icon={<GiYinYang size={24} style={{ color: "var(--brand-primary)" }} />}>
          <div className="table-responsive">
            <table className="values-table">
              <thead>
                <tr>
                  <th>Principle</th>
                  <th>Application and Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Authenticity</td><td>Rooted in traditional Hatha, Vinyasa, and Patanjali classical yoga.</td></tr>
                <tr><td>Inclusivity</td><td>Individualized biomechanical modifications suitable for all physiological constitutions.</td></tr>
                <tr><td>Scientific Rigor</td><td>Computer vision pose verification and kinematic angle validation.</td></tr>
                <tr><td>Transformative Growth</td><td>Integrates breath regulation (Pranayama) and focused meditation (Dharana).</td></tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="grid-3 mb-4">
          <SectionCard title="Curricular Offerings" icon={<FaLeaf size={20} style={{ color: "var(--brand-primary)" }} />}>
            <ul className="text-secondary ps-3 m-0 small">
              <li className="mb-1">Daily classical Hatha and dynamic Vinyasa sessions</li>
              <li className="mb-1">Immersive weekend retreats and anatomical workshops</li>
              <li className="mb-1">Yoga Alliance certified 200-Hour Teacher Training</li>
              <li>Real-time Computer Vision posture coaching</li>
            </ul>
          </SectionCard>

          <SectionCard title="Teacher Training" icon={<MdSchool size={22} style={{ color: "var(--brand-primary)" }} />}>
            <p className="text-secondary small mb-3">
              Our flagship training programs prepare thoughtful, scientifically grounded educators equipped with classical pedagogy.
            </p>
            <a className="btn btn-outline btn-sm" href="/training">Explore Curriculum <MdArrowForward size={14} /></a>
          </SectionCard>

          <SectionCard title="Facilities & Studio" icon={<MdLocationOn size={22} style={{ color: "var(--brand-primary)" }} />}>
            <ul className="text-secondary ps-3 m-0 small">
              <li className="mb-1">Spacious practice shala with natural light</li>
              <li className="mb-1">Eco-certified cork mats, bolsters, and straps</li>
              <li>Dedicated silent meditation garden</li>
            </ul>
          </SectionCard>
        </div>

        <SectionCard title="Faculty Mentors" icon={<MdPeople size={24} style={{ color: "var(--brand-primary)" }} />}>
          <div className="teacher-list">
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

        <SectionCard title="Student Experience & Testimonials" icon={<MdStar size={24} style={{ color: "var(--brand-primary)" }} />}>
          <blockquote className="testimonial">
            "Yogashrini provided the analytical depth and spiritual foundation I needed. The alignment feedback transformed my personal practice." – <em>Priya R.</em>
          </blockquote>
          <blockquote className="testimonial mb-0">
            "The combination of traditional philosophy with computer vision precision sets this institution apart." – <em>Arjun D.</em>
          </blockquote>
        </SectionCard>
      </main>

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
                  className="ud-modal-close-btn"
                  onClick={() => setReportModalOpen(false)}
                  aria-label="Close"
                >
                  <MdClose size={22} />
                </button>
              </div>

              <div className="ud-modal-body">
                {!generatedReport ? (
                  <div>
                    <p className="text-muted small mb-4">
                      Generate an official clinical-grade evaluation summarizing your posture alignment accuracy,
                      kinetic chain stability, anatomical contraindications, and a 30-day adaptive practice protocol.
                    </p>

                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold">Student Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold">Experience Level</label>
                        <select
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
                        <label className="form-label small fw-bold">Primary Target Goal</label>
                        <select
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
                        className="btn btn-secondary btn-sm"
                        onClick={() => setGeneratedReport(null)}
                      >
                        Generate Another
                      </button>
                      <button
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
