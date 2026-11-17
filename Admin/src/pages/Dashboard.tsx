import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../inc/Footer";
import Sidebar from "../inc/Sidebar";
import Top from "../inc/Top";
import {
  MdSchool,
  MdPeople,
  MdPayment,
  MdVideoLibrary,
  MdTrendingUp,
  MdStar,
  MdPlayCircle,
  MdSpa,
  MdShoppingBag,
  MdAutoAwesome,
  MdPsychology,
  MdAnalytics,
  MdLightbulb,
  MdRefresh,
  MdWarning,
  MdTimeline,
  MdSecurity,
  MdEmojiEvents,
} from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { ProductStats } from "../types";

const API = "http://localhost:2000";

interface AIRecommendation {
  category: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  recommendation: string;
  rationale: string;
  expectedImpact: string;
}

interface ExecutiveBriefing {
  executiveSummary?: string;
  retentionMetrics?: {
    projectedGrowthRate?: string;
    riskThreshold?: string;
    completionRate?: string;
    atRiskCourses?: number;
  };
  aiRecommendations?: AIRecommendation[];
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  value: string | number;
  label: string;
  color: string;
  change?: string;
  changeDir?: "up" | "down";
}

const enrollmentData = [
  { month: "Jan", enrollments: 12, revenue: 5400 },
  { month: "Feb", enrollments: 19, revenue: 8550 },
  { month: "Mar", enrollments: 15, revenue: 6750 },
  { month: "Apr", enrollments: 28, revenue: 12600 },
  { month: "May", enrollments: 34, revenue: 15300 },
  { month: "Jun", enrollments: 42, revenue: 18900 },
];

const courseProgressData = [
  { week: "Week 1", completions: 89 },
  { week: "Week 2", completions: 76 },
  { week: "Week 3", completions: 62 },
  { week: "Week 4", completions: 54 },
  { week: "Week 5", completions: 43 },
  { week: "Week 6", completions: 38 },
];

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, color, change, changeDir }) => {
  return (
    <motion.div
      className="stat-card"
      whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className={`stat-icon ${color}`}>
        <Icon />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change && (
          <div className={`stat-change ${changeDir || "up"}`}>
            <MdTrendingUp /> {change}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<{ totalEnrollments: number; totalRevenue: number }>({
    totalEnrollments: 0,
    totalRevenue: 0,
  });
  const [courseCount, setCourseCount] = useState<number>(0);
  const [productStats, setProductStats] = useState<ProductStats>({
    totalProducts: 0,
    outOfStockCount: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(false);
  const [briefingError, setBriefingError] = useState<string>("");

  const fetchBriefing = async () => {
    setLoadingBriefing(true);
    setBriefingError("");
    try {
      const res = await fetch(`${API}/ai/admin-executive-briefing`);
      const data = await res.json();
      if (data.success) {
        setBriefing(data.data);
      } else {
        setBriefingError("Failed to synthesize executive briefing.");
      }
    } catch {
      setBriefingError("AI Gateway currently unreachable.");
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    fetch(`${API}/payment/enrollment/stats`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});

    fetch(`${API}/course?all=true`)
      .then((r) => r.json())
      .then((d) => setCourseCount(d.courses?.length || 0))
      .catch(() => {});

    fetch(`${API}/product/stats`)
      .then((r) => r.json())
      .then((d) => setProductStats(d))
      .catch(() => {});

    fetchBriefing();
  }, []);

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Top title="Executive Decision Dashboard" />
        <div className="page-container">
          {/* AI Executive Intelligence Suite Header */}
          <motion.div
            className="ys-card"
            style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)",
              color: "#ffffff",
              padding: "24px 28px",
              borderRadius: "16px",
              marginBottom: "28px",
              boxShadow: "0 10px 25px -5px rgba(49, 46, 129, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#a5b4fc",
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: 6,
                  }}
                >
                  <MdAutoAwesome style={{ color: "#38bdf8", fontSize: 18 }} />
                  Yogashrini Intelligence Engine - Executive Suite
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px 0", color: "#ffffff" }}>
                  Autonomous Pedagogical & Growth Intelligence
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: "#c7d2fe", maxWidth: 720, lineHeight: 1.5 }}>
                  Real-time cognitive synthesis grounded in student kinetic telemetry, enrollment velocity,
                  curriculum progression, and multi-tier LLM inference.
                </p>
              </div>
              <button
                onClick={fetchBriefing}
                disabled={loadingBriefing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: loadingBriefing ? "not-allowed" : "pointer",
                  backdropFilter: "blur(6px)",
                  transition: "all 0.2s ease",
                }}
              >
                <MdRefresh
                  style={{ animation: loadingBriefing ? "spin 1s linear infinite" : "none", fontSize: 18 }}
                />
                {loadingBriefing ? "Synthesizing Briefing..." : "Refresh Intelligence"}
              </button>
            </div>

            {/* Metrics Bar */}
            {briefing && briefing.retentionMetrics && (
              <motion.div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 16,
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "12px 16px", borderRadius: 10 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#cbd5e1",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MdTimeline style={{ color: "#38bdf8" }} /> Projected Growth
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#38bdf8", marginTop: 4 }}>
                    {briefing.retentionMetrics.projectedGrowthRate || "Stable"}
                  </div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "12px 16px", borderRadius: 10 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#cbd5e1",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MdSecurity style={{ color: "#4ade80" }} /> Retention Risk Index
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#4ade80", marginTop: 4 }}>
                    {briefing.retentionMetrics.riskThreshold || "Low"}
                  </div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "12px 16px", borderRadius: 10 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#cbd5e1",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MdPlayCircle style={{ color: "#facc15" }} /> Avg Completion
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#facc15", marginTop: 4 }}>
                    {briefing.retentionMetrics.completionRate || "74%"}
                  </div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "12px 16px", borderRadius: 10 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#cbd5e1",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MdAnalytics style={{ color: "#c084fc" }} /> Target Interventions
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#c084fc", marginTop: 4 }}>
                    {briefing.retentionMetrics.atRiskCourses || 0} Courses Flagged
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* AI Strategic Recommendations Grid */}
          {briefing && briefing.aiRecommendations && briefing.aiRecommendations.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <MdLightbulb style={{ color: "#7C3AED", fontSize: 20 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1f2937", margin: 0 }}>
                  Prescriptive Growth & Pedagogical Directives
                </h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                {briefing.aiRecommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    className="ys-card"
                    style={{
                      padding: "18px 20px",
                      borderLeft: rec.priority === "HIGH" ? "4px solid #ef4444" : "4px solid #7C3AED",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280" }}>
                        {rec.category}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: rec.priority === "HIGH" ? "#fee2e2" : "#ede9fe",
                          color: rec.priority === "HIGH" ? "#b91c1c" : "#6d28d9",
                        }}
                      >
                        {rec.priority} PRIORITY
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#111827", marginBottom: 6 }}>
                      {rec.recommendation}
                    </div>
                    <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 10, lineHeight: 1.4 }}>
                      {rec.rationale}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MdTrendingUp /> Impact: {rec.expectedImpact}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* AI Executive Synthesis Narrative Card */}
          {briefing && briefing.executiveSummary && (
            <div className="ys-card" style={{ marginBottom: 28, borderLeft: "4px solid #4338ca" }}>
              <div className="ys-card-header">
                <div className="ys-card-title">
                  <MdPsychology style={{ color: "#4338ca", fontSize: 20 }} />
                  Executive Strategic Synthesis & Diagnosis
                </div>
              </div>
              <div className="ys-card-body">
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: "#374151",
                    background: "#f8fafc",
                    padding: "18px 20px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {briefing.executiveSummary}
                </div>
              </div>
            </div>
          )}

          {briefingError && (
            <div
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                color: "#be123c",
                padding: "12px 16px",
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MdWarning /> {briefingError}
            </div>
          )}

          {/* Stats Grid */}
          <div className="stat-grid mb-4">
            <StatCard
              icon={MdSchool}
              value={courseCount}
              label="Active Courses"
              color="purple"
              change="+2 cohorts"
              changeDir="up"
            />
            <StatCard
              icon={MdPeople}
              value={stats.totalEnrollments}
              label="Total Enrollments"
              color="green"
              change="+12 this cycle"
              changeDir="up"
            />
            <StatCard
              icon={MdPayment}
              value={`INR ${(stats.totalRevenue || 0).toLocaleString("en-IN")}`}
              label="Total Revenue"
              color="orange"
              change="+18% trajectory"
              changeDir="up"
            />
            <StatCard
              icon={MdSpa}
              value={productStats.totalProducts}
              label="Products Catalog"
              color="purple"
              change={`${productStats.outOfStockCount} out of stock`}
              changeDir={productStats.outOfStockCount > 0 ? "down" : "up"}
            />
            <StatCard
              icon={MdShoppingBag}
              value={productStats.totalOrders}
              label="Product Orders"
              color="green"
              change={`${productStats.pendingOrders} pending`}
              changeDir="up"
            />
            <StatCard icon={MdVideoLibrary} value="48" label="Videos Uploaded" color="blue" />
            <StatCard icon={MdEmojiEvents} value="3,250" label="XP Distributed" color="red" />
          </div>

          {/* Charts Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
              gap: 20,
              marginBottom: 28,
            }}
          >
            {/* Enrollment Trend */}
            <div className="ys-card">
              <div className="ys-card-header">
                <div className="ys-card-title">
                  <MdTrendingUp style={{ color: "#7C3AED" }} />
                  Enrollment Trajectory
                </div>
              </div>
              <div className="ys-card-body">
                <div className="chart-wrapper" style={{ height: "260px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={enrollmentData}>
                      <defs>
                        <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" fontSize={12} tick={{ fill: "#9ca3af" }} />
                      <YAxis fontSize={12} tick={{ fill: "#9ca3af" }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="enrollments"
                        stroke="#7C3AED"
                        strokeWidth={2.5}
                        fill="url(#enrollGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Course Completion */}
            <div className="ys-card">
              <div className="ys-card-header">
                <div className="ys-card-title">
                  <MdPlayCircle style={{ color: "#10b981" }} />
                  Week Completion Velocity
                </div>
              </div>
              <div className="ys-card-body">
                <div className="chart-wrapper" style={{ height: "260px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courseProgressData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" fontSize={12} tick={{ fill: "#9ca3af" }} />
                      <YAxis fontSize={12} tick={{ fill: "#9ca3af" }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                      <Bar dataKey="completions" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Area */}
          <div className="ys-card" style={{ marginBottom: 28 }}>
            <div className="ys-card-header">
              <div className="ys-card-title">
                <MdPayment style={{ color: "#f59e0b" }} />
                Revenue Analytics (INR)
              </div>
            </div>
            <div className="ys-card-body">
              <div className="chart-wrapper" style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrollmentData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" fontSize={12} tick={{ fill: "#9ca3af" }} />
                    <YAxis
                      fontSize={12}
                      tick={{ fill: "#9ca3af" }}
                      tickFormatter={(v) => `INR ${v}`}
                    />
                    <Tooltip
                      formatter={(v) => [`INR ${v}`, "Revenue"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fill="url(#revGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Guidelines */}
          <div className="ys-card">
            <div className="ys-card-header">
              <div className="ys-card-title">
                <MdStar style={{ color: "#7C3AED" }} />
                Platform Management Directives
              </div>
            </div>
            <div className="ys-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                {[
                  {
                    icon: MdSchool,
                    title: "Deploy Course Module",
                    desc: "Navigate to Add Course to configure syllabus, price, and total weeks.",
                    color: "purple",
                  },
                  {
                    icon: MdVideoLibrary,
                    title: "Curate Video Lessons",
                    desc: "Open Manage Weeks to link optimized video streams per learning module.",
                    color: "blue",
                  },
                  {
                    icon: MdPayment,
                    title: "Gateway Verification",
                    desc: "Ensure Razorpay live credentials are validated in Server environment config.",
                    color: "green",
                  },
                ].map(({ icon: Icon, title, desc, color }) => (
                  <div
                    key={title}
                    style={{
                      padding: "16px",
                      background: "#fafbff",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div className={`stat-icon ${color}`} style={{ marginBottom: 10 }}>
                      <Icon />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
