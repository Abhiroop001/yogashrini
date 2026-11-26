import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../inc/Sidebar";
import Top from "../inc/Top";
import Footer from "../inc/Footer";
import { MdArrowBack, MdAdd, MdSave } from "react-icons/md";
import { RiMapPin2Line } from "react-icons/ri";
import { adminFetch } from "../utils/api";

export const Addretreat: React.FC = () => {
  const nav = useNavigate();

  const [form, setForm] = useState({
    rname: "",
    rdate: "",
    rlocation: "",
    ractivities: "",
    rcost: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rname.trim()) return setMsg({ type: "danger", text: "Retreat name is required" });
    setLoading(true);

    const fd = new FormData();
    fd.append("rname", form.rname);
    fd.append("rdate", form.rdate);
    fd.append("rlocation", form.rlocation);
    fd.append("ractivities", form.ractivities);
    fd.append("rcost", form.rcost);

    try {
      const r = await adminFetch("/retreat/add", { method: "POST", body: fd });
      if (r.ok) {
        setMsg({ type: "success", text: "Retreat scheduled successfully!" });
        setForm({ rname: "", rdate: "", rlocation: "", ractivities: "", rcost: "" });
        setTimeout(() => nav("/listretreat"), 1200);
      } else {
        const data = await r.json();
        setMsg({ type: "danger", text: data.error || "Failed to add retreat" });
      }
    } catch {
      setMsg({ type: "danger", text: "Network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Top title="Add Retreat" />
        <div className="page-container">
          <div className="page-header">
            <div>
              <div className="page-title">Schedule New Retreat Cohort</div>
              <div className="page-subtitle">Configure nature sanctuary location, dates, price, and schedule</div>
            </div>
            <button onClick={() => nav("/listretreat")} className="btn-secondary-ys d-inline-flex align-items-center gap-1">
              <MdArrowBack /> Back to Retreats
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

          <div className="ys-card">
            <div className="ys-card-header">
              <div className="ys-card-title">
                <RiMapPin2Line style={{ color: "#7C3AED" }} /> Retreat Specifications
              </div>
            </div>
            <div className="ys-card-body">
              <form onSubmit={handleSubmit}>
                <div className="ys-form-group">
                  <label className="ys-label">Retreat Title *</label>
                  <input
                    className="ys-input"
                    name="rname"
                    required
                    value={form.rname}
                    onChange={handleChange}
                    placeholder="e.g. Himalayan Breathwork & Silent Meditation Sanctuary"
                  />
                </div>

                <div className="ys-form-grid">
                  <div className="ys-form-group">
                    <label className="ys-label">Dates / Cohort Window</label>
                    <input
                      className="ys-input"
                      name="rdate"
                      value={form.rdate}
                      onChange={handleChange}
                      placeholder="e.g. Oct 15 - Oct 22, 2026"
                    />
                  </div>

                  <div className="ys-form-group">
                    <label className="ys-label">Location / Sanctuary</label>
                    <input
                      className="ys-input"
                      name="rlocation"
                      value={form.rlocation}
                      onChange={handleChange}
                      placeholder="e.g. Rishikesh, Uttarakhand"
                    />
                  </div>
                </div>

                <div className="ys-form-grid">
                  <div className="ys-form-group">
                    <label className="ys-label">Package Cost (INR)</label>
                    <input
                      className="ys-input"
                      name="rcost"
                      value={form.rcost}
                      onChange={handleChange}
                      placeholder="e.g. 24,000"
                    />
                  </div>

                  <div className="ys-form-group">
                    <label className="ys-label">Included Curriculum & Activities</label>
                    <input
                      className="ys-input"
                      name="ractivities"
                      value={form.ractivities}
                      onChange={handleChange}
                      placeholder="e.g. Hatha, Pranayama, Satvik meals, Ganga Aarti"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                  <button type="submit" disabled={loading} className="btn-primary-ys d-inline-flex align-items-center gap-1">
                    <MdSave /> {loading ? "Saving..." : "Schedule Retreat"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Addretreat;
