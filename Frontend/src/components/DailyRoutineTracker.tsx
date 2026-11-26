// Frontend/src/components/DailyRoutineTracker.tsx
// Anthropometric (Weight/Height/Goal) Daily Routine & Diet Tracker with Asana Images & Structured PDF Export
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdMonitorWeight,
  MdHeight,
  MdFitnessCenter,
  MdRestaurantMenu,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdPictureAsPdf,
  MdPrint,
  MdAutoAwesome,
  MdWaterDrop,
  MdLocalFireDepartment,
  MdWarning,
  MdExpandMore,
  MdExpandLess,
  MdSelfImprovement,
} from "react-icons/md";
import { RiHeartPulseLine } from "react-icons/ri";
import { authFetch } from "../utils/api";
import { DailyRoutineTrackerData } from "../types";
import { exportRoutineToPdf } from "../utils/routinePdf";

interface DailyRoutineTrackerProps {
  studentName?: string;
  userKey?: string;
}

type TrackerTab = "schedule" | "diet" | "asanas";

export const DailyRoutineTracker: React.FC<DailyRoutineTrackerProps> = ({
  studentName = "Practitioner",
  userKey = "guest",
}) => {
  const [weightKg, setWeightKg] = useState<string>("68");
  const [heightCm, setHeightCm] = useState<string>("170");
  const [age, setAge] = useState<string>("28");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [goal, setGoal] = useState<"weight_loss" | "weight_gain" | "maintain">("weight_loss");
  const [activityLevel, setActivityLevel] = useState<string>("moderate");
  const [dietPreference, setDietPreference] = useState<string>("vegetarian");
  const [durationMinutes, setDurationMinutes] = useState<string>("35");
  const [focusNote, setFocusNote] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [pdfExporting, setPdfExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [tracker, setTracker] = useState<DailyRoutineTrackerData | null>(null);
  const [activeTab, setActiveTab] = useState<TrackerTab>("schedule");
  const [expanded, setExpanded] = useState<boolean>(true);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const storageKey = useMemo(
    () => `yogashrini_daily_tracker_${userKey || "guest"}_${todayKey}`,
    [userKey, todayKey]
  );

  // Restore saved daily plan & checklist cleanly per user & date
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.tracker) {
          setTracker(parsed.tracker);
          const m = parsed.tracker.metrics;
          if (m) {
            if (m.weightKg) setWeightKg(String(m.weightKg));
            if (m.heightCm) setHeightCm(String(m.heightCm));
            if (m.age) setAge(String(m.age));
            if (m.sex === "female" || m.sex === "male") setSex(m.sex);
            if (m.goal) setGoal(m.goal as any);
            if (m.activityLevel) setActivityLevel(m.activityLevel);
            if (m.durationMinutes) setDurationMinutes(String(m.durationMinutes));
          }
          if (parsed.tracker.dietPreference) setDietPreference(parsed.tracker.dietPreference);
        }
        if (parsed?.checkedIds) setCheckedIds(parsed.checkedIds);
      } else {
        setCheckedIds({});
      }
    } catch {
      // Ignore corrupt cache
    }
  }, [storageKey]);

  const persistState = (nextTracker: DailyRoutineTrackerData | null, nextChecks: Record<string, boolean>) => {
    try {
      if (nextTracker) {
        localStorage.setItem(storageKey, JSON.stringify({ tracker: nextTracker, checkedIds: nextChecks }));
      }
    } catch {
      // Ignore storage quota warnings
    }
  };

  // Live instant BMI readout before generating
  const liveBmi = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 25 || h < 80) return null;
    const val = w / Math.pow(h / 100, 2);
    return Number(val.toFixed(1));
  }, [weightKg, heightCm]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!Number.isFinite(w) || w < 30 || w > 250) {
      setErrorMsg("Enter a valid weight between 30 and 250 kg.");
      return;
    }
    if (!Number.isFinite(h) || h < 100 || h > 240) {
      setErrorMsg("Enter a valid height between 100 and 240 cm.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await authFetch("/ai/daily-routine-tracker", {
        method: "POST",
        body: JSON.stringify({
          studentName,
          weightKg: w,
          heightCm: h,
          age: parseInt(age, 10) || 28,
          sex,
          goal,
          activityLevel,
          dietPreference,
          durationMinutes: parseInt(durationMinutes, 10) || 35,
          focusNote,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success || !data.tracker) {
        throw new Error(data.error || "Unable to synthesize routine tracker.");
      }
      setTracker(data.tracker);
      setCheckedIds({});
      setExpanded(true);
      persistState(data.tracker, {});
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to connect to the clinical nutrition RAG service.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (slotId: string) => {
    const next = { ...checkedIds, [slotId]: !checkedIds[slotId] };
    setCheckedIds(next);
    persistState(tracker, next);
  };

  const handleDownloadPdf = async () => {
    if (!tracker || pdfExporting) return;
    setPdfExporting(true);
    setErrorMsg("");
    try {
      await exportRoutineToPdf(tracker);
    } catch (err: any) {
      setErrorMsg("Could not export PDF cleanly. Please try 'Print Routine' instead.");
    } finally {
      setPdfExporting(false);
    }
  };

  const handlePrint = () => {
    if (!tracker) return;
    document.body.classList.add("printing-daily-tracker");
    const cleanup = () => document.body.classList.remove("printing-daily-tracker");
    window.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1200);
    }, 100);
  };

  const completedCount = tracker
    ? tracker.dailySchedule.filter((s) => checkedIds[s.id]).length
    : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="ud-card ud-tracker-card mb-3"
      aria-labelledby="daily-tracker-title"
    >
      {/* Header */}
      <div className="ud-card-header flex-wrap gap-2 ud-hide-on-print">
        <div className="d-flex align-items-center gap-2">
          <div className="ud-card-icon">
            <RiHeartPulseLine />
          </div>
          <div>
            <h3 id="daily-tracker-title" className="m-0 fs-5 fw-bold">
              Weight & Height Daily Diet & Asana Tracker
            </h3>
            <p className="text-muted small m-0">
              Grounded in Mifflin-St Jeor, WHO BMI, ICMR-NIN & PubMed Yoga Metabolic Protocols
            </p>
          </div>
        </div>
        {liveBmi !== null && (
          <span className="badge-pill badge-primary">
            Est. BMI: {liveBmi} kg/m²
          </span>
        )}
      </div>

      {/* Form Inputs */}
      <form onSubmit={handleGenerate} className="ud-hide-on-print">
        <div className="row g-2 mb-3">
          <div className="col-6 col-sm-4 col-lg-2">
            <label htmlFor="dt-weight" className="form-label small fw-bold mb-1">
              <MdMonitorWeight size={14} className="me-1" />Weight (kg)
            </label>
            <input
              id="dt-weight"
              type="number"
              min={30}
              max={250}
              step="0.5"
              className="form-control form-control-sm"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-sm-4 col-lg-2">
            <label htmlFor="dt-height" className="form-label small fw-bold mb-1">
              <MdHeight size={14} className="me-1" />Height (cm)
            </label>
            <input
              id="dt-height"
              type="number"
              min={100}
              max={240}
              className="form-control form-control-sm"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              required
            />
          </div>

          <div className="col-12 col-sm-6 col-md-4 col-lg-2">
            <label htmlFor="dt-goal" className="form-label small fw-bold mb-1">
              Preference / Goal
            </label>
            <select
              id="dt-goal"
              className="form-select form-select-sm"
              value={goal}
              onChange={(e) => setGoal(e.target.value as any)}
            >
              <option value="weight_loss">Weight Loss (Fat Burn)</option>
              <option value="weight_gain">Weight Gain (Lean Mass)</option>
              <option value="maintain">Maintain & Mobility</option>
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-4 col-lg-2">
            <label htmlFor="dt-diet" className="form-label small fw-bold mb-1">
              <MdRestaurantMenu size={14} className="me-1" />Diet Style
            </label>
            <select
              id="dt-diet"
              className="form-select form-select-sm"
              value={dietPreference}
              onChange={(e) => setDietPreference(e.target.value)}
            >
              <option value="vegetarian">Vegetarian (Sattvic)</option>
              <option value="eggetarian">Eggetarian</option>
              <option value="non_vegetarian">Balanced Non-Veg</option>
            </select>
          </div>

          <div className="col-6 col-sm-6 col-md-4 col-lg-2">
            <label htmlFor="dt-activity" className="form-label small fw-bold mb-1">
              Activity Level
            </label>
            <select
              id="dt-activity"
              className="form-select form-select-sm"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Light (1-3d/wk)</option>
              <option value="moderate">Moderate (3-5d/wk)</option>
              <option value="very_active">Active (6-7d/wk)</option>
            </select>
          </div>

          <div className="col-6 col-sm-6 col-md-4 col-lg-2">
            <label htmlFor="dt-duration" className="form-label small fw-bold mb-1">
              Yoga Time
            </label>
            <select
              id="dt-duration"
              className="form-select form-select-sm"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            >
              <option value="20">20 Minutes</option>
              <option value="35">35 Minutes</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes</option>
            </select>
          </div>
        </div>

        <div className="row g-2 align-items-end mb-2">
          <div className="col-6 col-sm-3 col-lg-2">
            <label htmlFor="dt-age" className="form-label small fw-bold mb-1">Age (yrs)</label>
            <input
              id="dt-age"
              type="number"
              min={12}
              max={95}
              className="form-control form-control-sm"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div className="col-6 col-sm-3 col-lg-2">
            <label htmlFor="dt-sex" className="form-label small fw-bold mb-1">Metabolic Profile</label>
            <select
              id="dt-sex"
              className="form-select form-select-sm"
              value={sex}
              onChange={(e) => setSex(e.target.value as any)}
            >
              <option value="male">Male (BMR +5)</option>
              <option value="female">Female (BMR -161)</option>
            </select>
          </div>
          <div className="col-12 col-sm-6 col-lg-5">
            <label htmlFor="dt-note" className="form-label small fw-bold mb-1">
              Optional Health Note (e.g. Knee safe, PCOD, Desk stiffness)
            </label>
            <input
              id="dt-note"
              type="text"
              className="form-control form-control-sm"
              placeholder="Optional joint or lifestyle focus..."
              value={focusNote}
              onChange={(e) => setFocusNote(e.target.value)}
            />
          </div>
          <div className="col-12 col-lg-3">
            <button
              type="submit"
              className="btn btn-primary btn-sm w-100"
              disabled={loading}
            >
              <MdAutoAwesome size={16} />
              {loading ? "Synthesizing Tracker..." : "Generate Daily Routine & Diet"}
            </button>
          </div>
        </div>
      </form>

      {errorMsg && (
        <div className="alert alert-danger py-2 px-3 small mt-2 mb-2 ud-hide-on-print">
          {errorMsg}
        </div>
      )}

      {/* Generated Result Display & Printable Structure */}
      <AnimatePresence>
        {tracker && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="ud-tracker-print-root mt-3 pt-3 border-top"
          >
            {/* Action Toolbar (Download PDF / Print / Expand) */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 ud-hide-on-print">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="badge-pill badge-emerald">
                  {tracker.goalLabel}
                </span>
                <span className="small fw-semibold text-secondary">
                  Daily Checklist: {completedCount}/{tracker.dailySchedule.length} Done
                </span>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleDownloadPdf}
                  disabled={pdfExporting}
                >
                  <MdPictureAsPdf size={16} />
                  {pdfExporting ? "Rendering PDF..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handlePrint}
                >
                  <MdPrint size={16} /> Print Routine
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                  {expanded ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {expanded && (
              <div>
                {/* Print Header Banner (shown nicely on print page too) */}
                <div className="ud-print-banner mb-3">
                  <h4 className="m-0 fs-6 fw-bold">
                    YOGASHRINI DAILY METABOLIC DIET & ASANA TRACKER — {tracker.studentName}
                  </h4>
                  <div className="small text-secondary">
                    {tracker.goalLabel} | {tracker.metrics.weightKg} kg / {tracker.metrics.heightCm} cm | Generated {new Date(tracker.generatedAt).toLocaleDateString()}
                  </div>
                </div>

                <p className="small text-secondary mb-3">{tracker.summary}</p>

                {/* Biometric & Macro KPI Strip */}
                <div className="ud-tracker-kpi-grid mb-3">
                  <div className="ud-tracker-kpi">
                    <span className="ud-tracker-kpi-label">BMI ({tracker.metrics.asianBmiCategory})</span>
                    <strong>{tracker.metrics.bmi} kg/m²</strong>
                  </div>
                  <div className="ud-tracker-kpi">
                    <span className="ud-tracker-kpi-label">Daily Calorie Target</span>
                    <strong style={{ color: "var(--brand-primary)" }}>
                      {tracker.metrics.targetCalories} kcal
                    </strong>
                  </div>
                  <div className="ud-tracker-kpi">
                    <span className="ud-tracker-kpi-label">Protein / Carbs / Fats</span>
                    <strong>
                      {tracker.metrics.macros.proteinG}g / {tracker.metrics.macros.carbsG}g / {tracker.metrics.macros.fatsG}g
                    </strong>
                  </div>
                  <div className="ud-tracker-kpi">
                    <span className="ud-tracker-kpi-label">
                      <MdWaterDrop size={12} /> Water & <MdLocalFireDepartment size={12} /> Yoga Burn
                    </span>
                    <strong>
                      {tracker.metrics.hydrationLiters} L · ~{tracker.metrics.sessionCaloriesBurned} kcal
                    </strong>
                  </div>
                </div>

                {/* Screen Navigation Tabs (hidden on print; print prints all 3 sections) */}
                <div className="d-flex gap-2 flex-wrap mb-3 ud-hide-on-print">
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === "schedule" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveTab("schedule")}
                  >
                    <MdCheckBox size={15} /> Daily Checklist ({completedCount}/{tracker.dailySchedule.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === "diet" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveTab("diet")}
                  >
                    <MdRestaurantMenu size={15} /> Prescribed Diet ({tracker.dietPlan.length} Meals)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === "asanas" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveTab("asanas")}
                  >
                    <MdFitnessCenter size={15} /> Asanas & Images ({tracker.recommendedAsanas.length})
                  </button>
                </div>

                {/* Section 1: Daily Routine Checklist */}
                <div className={activeTab === "schedule" ? "mb-3" : "ud-tracker-print-only-expand mb-3"}>
                  <h5 className="fs-6 fw-bold mb-2">Daily Routine Checklist</h5>
                  <div className="d-flex flex-column gap-2">
                    {tracker.dailySchedule.map((slot) => {
                      const done = Boolean(checkedIds[slot.id]);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleSlot(slot.id)}
                          className={`ud-schedule-row text-start ${done ? "is-done" : ""}`}
                        >
                          <div className="ud-schedule-check">
                            {done ? (
                              <MdCheckBox size={20} style={{ color: "#10b981" }} />
                            ) : (
                              <MdCheckBoxOutlineBlank size={20} style={{ color: "var(--brand-primary)" }} />
                            )}
                          </div>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                              <span className="fw-bold small">
                                {slot.timeSlot} — {slot.blockTitle}
                              </span>
                              <span className="badge-pill badge-accent">{slot.metric || slot.category}</span>
                            </div>
                            <div className="small text-secondary mt-1">{slot.details}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Prescribed Diet Plan */}
                <div className={activeTab === "diet" ? "mb-3" : "ud-tracker-print-only-expand mb-3"}>
                  <h5 className="fs-6 fw-bold mb-2">Prescribed Daily Diet & Nutrition Plan</h5>
                  <div className="row g-2 mb-2">
                    {tracker.dietPlan.map((meal, idx) => (
                      <div key={idx} className="col-12 col-md-6">
                        <div className="p-3 rounded-3 h-100" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                          <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                            <strong className="small" style={{ color: "var(--brand-primary)" }}>
                              {meal.timing} · {meal.mealName}
                            </strong>
                            <span className="badge-pill badge-emerald">
                              {meal.calories} kcal · {meal.proteinG}g P
                            </span>
                          </div>
                          <ul className="small text-secondary ps-3 mb-1">
                            {meal.items.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                          <div className="small text-muted fst-italic">{meal.rationale}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {tracker.nutritionTips.length > 0 && (
                    <div className="p-2 px-3 rounded-3 small text-secondary" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                      <strong className="d-block mb-1">Nutrition Engineering Guidelines:</strong>
                      <ul className="ps-3 m-0">
                        {tracker.nutritionTips.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Section 3: Recommended Asanas WITH Images */}
                <div className={activeTab === "asanas" ? "mb-2" : "ud-tracker-print-only-expand mb-2"}>
                  <h5 className="fs-6 fw-bold mb-2">Recommended Asanas & Visual Posture Guides</h5>
                  <div className="row g-2">
                    {tracker.recommendedAsanas.map((a, idx) => (
                      <div key={idx} className="col-12 col-md-6">
                        <div className="ud-tracker-asana-card h-100">
                          <div className="ud-tracker-asana-thumb">
                            {a.imageUrl ? (
                              <img
                                src={a.imageUrl}
                                alt={`${a.sanskritName} (${a.englishName})`}
                                loading="lazy"
                              />
                            ) : (
                              <MdSelfImprovement size={42} style={{ color: "var(--brand-primary)" }} />
                            )}
                          </div>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-1 mb-1">
                              <strong className="small" style={{ color: "var(--brand-primary)" }}>
                                {a.sanskritName} ({a.englishName})
                              </strong>
                              <span className="badge-pill badge-accent">{a.duration}</span>
                            </div>
                            <div className="small fw-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                              {a.phase} · {a.caloriesEst}
                            </div>
                            <p className="small text-secondary mb-1">{a.alignmentCue}</p>
                            <p className="small text-secondary mb-1"><strong>Benefit:</strong> {a.benefit}</p>
                            <div className="small text-danger">
                              <MdWarning size={13} className="me-1" />
                              {a.contraindication}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety & Clinical Citations */}
                <div className="mt-3 pt-2 border-top small text-muted">
                  <div>
                    <strong>Clinical Safeguards:</strong> {tracker.safetyNotes.join(" ")}
                  </div>
                  <div className="mt-1">
                    <strong>RAG Evidence Sources:</strong> {tracker.citations.join(" | ")}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default DailyRoutineTracker;
