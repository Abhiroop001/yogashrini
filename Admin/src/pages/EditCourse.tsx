import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../inc/Sidebar";
import Top from "../inc/Top";
import Footer from "../inc/Footer";
import { MdCloudUpload, MdSchool, MdSave, MdArrowBack } from "react-icons/md";
import { adminFetch, API_BASE as API } from "../utils/api";

interface CourseFormData {
  title: string;
  description: string;
  price: string | number;
  totalWeeks: string | number;
  level: string;
  instructor: string;
  isPublished: boolean;
}

export const EditCourse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const thumbRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CourseFormData | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    adminFetch(`/course/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const c = d.course;
        setForm({
          title: c.title || "",
          description: c.description || "",
          price: c.price ?? "",
          totalWeeks: c.totalWeeks ?? "",
          level: c.level || "Beginner",
          instructor: c.instructor || "",
          isPublished: c.isPublished || false,
        });
        if (c.thumbnail) setThumbPreview(`${API}/thumbnails/${c.thumbnail}`);
      })
      .catch(() => setMsg({ type: "danger", text: "Failed to load course details" }));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setForm((f) => (f ? { ...f, [target.name]: value } : f));
  };

  const handleThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !id) return;
    setLoading(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (thumbFile) fd.append("thumbnail", thumbFile);

    try {
      const r = await adminFetch(`/course/${id}`, { method: "PUT", body: fd });
      const data = await r.json();
      if (r.ok) {
        setMsg({ type: "success", text: "Course curriculum updated successfully" });
        setTimeout(() => nav("/courses"), 1500);
      } else {
        setMsg({ type: "danger", text: data.error || "Update failed" });
      }
    } catch {
      setMsg({ type: "danger", text: "Network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return (
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-content">
          <Top title="Edit Course" />
          <div className="page-container" style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="spinner-border text-primary" />
            <p className="text-muted mt-2 small">Loading curriculum details...</p>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Top title="Edit Course" />
        <div className="page-container">
          <div className="page-header">
            <div>
              <div className="page-title">Modify Course Parameters</div>
              <div className="page-subtitle">Update cohort pricing, duration, instructor, and media</div>
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
              <div>
                <div className="ys-card" style={{ marginBottom: 20 }}>
                  <div className="ys-card-header">
                    <div className="ys-card-title">
                      <MdSchool /> Curriculum Information
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
                      />
                    </div>

                    <div className="ys-form-group">
                      <label className="ys-label">Description *</label>
                      <textarea
                        className="ys-input ys-textarea"
                        name="description"
                        required
                        rows={4}
                        value={form.description}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="ys-form-grid">
                      <div className="ys-form-group">
                        <label className="ys-label">Instructor</label>
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
                        <label className="ys-label">Total Weeks *</label>
                        <input
                          type="number"
                          className="ys-input"
                          name="totalWeeks"
                          required
                          value={form.totalWeeks}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="ys-form-group">
                        <label className="ys-label">Price (INR)</label>
                        <input
                          type="number"
                          className="ys-input"
                          name="price"
                          value={form.price}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="ys-card" style={{ marginBottom: 20 }}>
                  <div className="ys-card-header">
                    <div className="ys-card-title">Cover Image</div>
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
                          alt="Cover preview"
                          style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        <div style={{ color: "#9ca3af" }}>
                          <MdCloudUpload size={36} />
                          <div style={{ fontSize: 13, marginTop: 8 }}>Select replacement thumbnail</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ys-card">
                  <div className="ys-card-header">
                    <div className="ys-card-title">Publication & Save</div>
                  </div>
                  <div className="ys-card-body">
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 16 }}>
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={form.isPublished}
                        onChange={handleChange}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Published to Student Portal</span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary-ys"
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      <MdSave /> {loading ? "Saving Changes..." : "Update Course"}
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

export default EditCourse;
