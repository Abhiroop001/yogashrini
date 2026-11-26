import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../inc/Sidebar";
import Top from "../inc/Top";
import Footer from "../inc/Footer";
import { MdCloudUpload, MdSchool, MdSave, MdArrowBack } from "react-icons/md";
import { adminFetch } from "../utils/api";

export const AddCourse: React.FC = () => {
  const nav = useNavigate();
  const thumbRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    totalWeeks: "",
    level: "Beginner",
    instructor: "Yogashrini Faculty",
    isPublished: false,
  });
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setForm((f) => ({ ...f, [target.name]: value }));
  };

  const handleThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setMsg({ type: "danger", text: "Title is required" });
    if (!form.totalWeeks) return setMsg({ type: "danger", text: "Total weeks is required" });
    setLoading(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (thumbFile) fd.append("thumbnail", thumbFile);

    try {
      const r = await adminFetch("/course", { method: "POST", body: fd });
      const data = await r.json();
      if (r.ok) {
        setMsg({ type: "success", text: "Course initialized! Redirecting to syllabus manager..." });
        setTimeout(() => nav(`/managecourse/${data.course._id}`), 1200);
      } else {
        setMsg({ type: "danger", text: data.error || "Failed to create course" });
      }
    } catch {
      setMsg({ type: "danger", text: "Network connection error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Top title="Create Course" />
        <div className="page-container">
          <div className="page-header">
            <div>
              <div className="page-title">Curriculum Architect</div>
              <div className="page-subtitle">Configure cohort parameters and initialize weekly video roadmaps</div>
            </div>
            <button onClick={() => nav("/courses")} className="btn-secondary-ys d-inline-flex align-items-center gap-1">
              <MdArrowBack /> Back to Courses
            </button>
          </div>

          <AnimatePresence>
            {msg && (
              <motion.div
                className={`ys-alert ys-alert-${msg.type}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {msg.text}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <div className="admin-form-split">
              {/* Main Information */}
              <div>
                <div className="ys-card" style={{ marginBottom: 20 }}>
                  <div className="ys-card-header">
                    <div className="ys-card-title">
                      <MdSchool /> Course Parameters
                    </div>
                  </div>
                  <div className="ys-card-body">
                    <div className="ys-form-group">
                      <label className="ys-label">Course Title *</label>
                      <input
                        className="ys-input"
                        name="title"
                        required
                        value={form.title}
                        onChange={handleChange}
                        placeholder="e.g. Asana Alignment & Kinetic Mechanics"
                      />
                    </div>

                    <div className="ys-form-group">
                      <label className="ys-label">Comprehensive Description *</label>
                      <textarea
                        className="ys-input ys-textarea"
                        name="description"
                        required
                        rows={4}
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Describe the anatomical alignment, outcomes, and philosophy..."
                      />
                    </div>

                    <div className="ys-form-grid">
                      <div className="ys-form-group">
                        <label className="ys-label">Faculty / Instructor</label>
                        <input
                          className="ys-input"
                          name="instructor"
                          value={form.instructor}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="ys-form-group">
                        <label className="ys-label">Practice Level</label>
                        <select
                          className="ys-input"
                          name="level"
                          value={form.level}
                          onChange={handleChange}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div className="ys-form-grid">
                      <div className="ys-form-group">
                        <label className="ys-label">Total Duration (Weeks) *</label>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          className="ys-input"
                          name="totalWeeks"
                          required
                          value={form.totalWeeks}
                          onChange={handleChange}
                          placeholder="e.g. 6"
                        />
                      </div>

                      <div className="ys-form-group">
                        <label className="ys-label">Tuition Fee (INR, 0 for free)</label>
                        <input
                          type="number"
                          min="0"
                          className="ys-input"
                          name="price"
                          value={form.price}
                          onChange={handleChange}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar thumbnail & publish */}
              <div>
                <div className="ys-card" style={{ marginBottom: 20 }}>
                  <div className="ys-card-header">
                    <div className="ys-card-title">Thumbnail & Cover</div>
                  </div>
                  <div className="ys-card-body">
                    <div
                      className="dropzone-ys"
                      onClick={() => thumbRef.current?.click()}
                      style={{ cursor: "pointer", textAlign: "center", padding: "20px" }}
                    >
                      <input
                        ref={thumbRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThumb}
                        style={{ display: "none" }}
                      />
                      {thumbPreview ? (
                        <img
                          src={thumbPreview}
                          alt="Thumbnail preview"
                          style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        <div style={{ color: "#9ca3af" }}>
                          <MdCloudUpload size={36} />
                          <div style={{ fontSize: 13, marginTop: 8 }}>Click to select thumbnail image</div>
                          <div style={{ fontSize: 11, color: "#cbd5e1" }}>PNG, JPG or WEBP</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ys-card">
                  <div className="ys-card-header">
                    <div className="ys-card-title">Publication Status</div>
                  </div>
                  <div className="ys-card-body">
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 16 }}>
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={form.isPublished}
                        onChange={handleChange}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Publish immediately to students</span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary-ys"
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      <MdSave /> {loading ? "Creating..." : "Save & Configure Weeks"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default AddCourse;
