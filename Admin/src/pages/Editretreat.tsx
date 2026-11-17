import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../inc/Sidebar";
import Top from "../inc/Top";
import Footer from "../inc/Footer";
import { MdSave, MdArrowBack } from "react-icons/md";
import { RiMapPin2Line } from "react-icons/ri";

const API = "http://localhost:2000";

interface RetreatFormData {
  rname: string;
  rdate: string;
  rlocation: string;
  ractivities: string;
  rcost: string;
}

export const Editretreat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [form, setForm] = useState<RetreatFormData>({
    rname: "",
    rdate: "",
    rlocation: "",
    ractivities: "",
    rcost: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    const fd = new FormData();
    fd.append("id", id);
    fetch(`${API}/retreat/edit`, { method: "POST", body: fd })
      .then((r) => r.json())
      .then((data) => {
        setForm({
          rname: data.rname || "",
          rdate: data.rdate || "",
          rlocation: data.rlocation || "",
          ractivities: data.ractivities || "",
          rcost: data.rcost || "",
        });
        setFetching(false);
      })
      .catch(() => {
        setFetching(false);
        setMsg({ type: "danger", text: "Failed to load retreat details" });
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("id", id);
    fd.append("rname", form.rname);
    fd.append("rdate", form.rdate);
    fd.append("rlocation", form.rlocation);
    fd.append("ractivities", form.ractivities);
    fd.append("rcost", form.rcost);

    try {
      const r = await fetch(`${API}/retreat/upd`, { method: "POST", body: fd });
      if (r.ok) {
        setMsg({ type: "success", text: "Retreat details updated" });
        setTimeout(() => nav("/listretreat"), 1200);
      } else {
        setMsg({ type: "danger", text: "Update failed" });
      }
    } catch {
      setMsg({ type: "danger", text: "Network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-content">
          <Top title="Edit Retreat" />
          <div className="page-container" style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="spinner-border text-primary" />
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
        <Top title="Edit Retreat" />
        <div className="page-container">
          <div className="page-header">
            <div>
              <div className="page-title">Modify Retreat Schedule</div>
              <div className="page-subtitle">Update dates, pricing, sanctuary location, and activities</div>
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
                  <label className="ys-label">Retreat Name</label>
                  <input
                    className="ys-input"
                    name="rname"
                    required
                    value={form.rname}
                    onChange={handleChange}
                  />
                </div>

                <div className="ys-form-grid">
                  <div className="ys-form-group">
                    <label className="ys-label">Dates</label>
                    <input
                      className="ys-input"
                      name="rdate"
                      value={form.rdate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="ys-form-group">
                    <label className="ys-label">Location</label>
                    <input
                      className="ys-input"
                      name="rlocation"
                      value={form.rlocation}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="ys-form-grid">
                  <div className="ys-form-group">
                    <label className="ys-label">Cost</label>
                    <input
                      className="ys-input"
                      name="rcost"
                      value={form.rcost}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="ys-form-group">
                    <label className="ys-label">Activities & Inclusions</label>
                    <input
                      className="ys-input"
                      name="ractivities"
                      value={form.ractivities}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                  <button type="submit" disabled={loading} className="btn-primary-ys d-inline-flex align-items-center gap-1">
                    <MdSave /> {loading ? "Updating..." : "Save Changes"}
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

export default Editretreat;
