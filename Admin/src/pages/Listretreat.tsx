import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../inc/Sidebar";
import Top from "../inc/Top";
import Footer from "../inc/Footer";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdCalendarToday } from "react-icons/md";
import { RiMapPin2Line, RiCoinsLine } from "react-icons/ri";
import { Retreat } from "../types";

const API = "http://localhost:2000";

export const Listretreat: React.FC = () => {
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const getdata = useCallback(async () => {
    try {
      const resp = await fetch(`${API}/retreat/sel`);
      const data = await resp.json();
      setRetreats(Array.isArray(data) ? data : []);
    } catch {
      setMsg({ type: "danger", text: "Failed to load retreats" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getdata();
  }, [getdata]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this retreat sanctuary record?")) return;
    const fd = new FormData();
    fd.append("id", id);
    try {
      await fetch(`${API}/retreat/del`, { method: "POST", body: fd });
      setMsg({ type: "success", text: "Retreat schedule removed" });
      getdata();
      setTimeout(() => setMsg(null), 2500);
    } catch {
      setMsg({ type: "danger", text: "Deletion failed" });
    }
  };

  const filtered = retreats.filter(
    (r) =>
      (r.rname || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.rlocation || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Top title="Retreats Management" />
        <div className="page-container">
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

          <div className="page-header">
            <div>
              <div className="page-title">Retreat Sanctuaries</div>
              <div className="page-subtitle">
                {retreats.length} immersive cohort{retreats.length !== 1 ? "s" : ""} scheduled
              </div>
            </div>
            <Link to="/addretreat" className="btn-primary-ys d-inline-flex align-items-center gap-1">
              <MdAdd /> Schedule Retreat
            </Link>
          </div>

          <div className="ys-card">
            <div className="ys-card-header">
              <div className="ys-card-title">
                <RiMapPin2Line style={{ color: "#7C3AED" }} /> Scheduled Retreat Itineraries
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f4f5fa",
                  borderRadius: 8,
                  padding: "8px 14px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <MdSearch style={{ color: "#9ca3af" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by location or name..."
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 13,
                    width: 180,
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                  <div className="spinner-border text-primary" />
                </div>
              ) : (
                <table className="ys-table">
                  <thead>
                    <tr>
                      <th>Retreat Title</th>
                      <th>Dates</th>
                      <th>Location</th>
                      <th>Included Curriculum</th>
                      <th>Package Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>
                          No retreats found. <Link to="/addretreat" style={{ color: "#7C3AED" }}>Create one</Link>
                        </td>
                      </tr>
                    )}
                    {filtered.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <div style={{ fontWeight: 700, color: "#1e1e2e" }}>{r.rname}</div>
                        </td>
                        <td>
                          {r.rdate ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                              <MdCalendarToday style={{ color: "#7C3AED", fontSize: 14 }} />
                              {r.rdate}
                            </div>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>TBA</span>
                          )}
                        </td>
                        <td>
                          {r.rlocation ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                              <RiMapPin2Line style={{ color: "#10b981", fontSize: 14 }} />
                              {r.rlocation}
                            </div>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>TBA</span>
                          )}
                        </td>
                        <td style={{ maxWidth: 220, color: "#6b7280", fontSize: 13 }}>
                          {r.ractivities
                            ? r.ractivities.length > 70
                              ? r.ractivities.slice(0, 70) + "..."
                              : r.ractivities
                            : "-"}
                        </td>
                        <td>
                          {r.rcost ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <RiCoinsLine style={{ color: "#f59e0b" }} />
                              <span style={{ fontWeight: 700, color: "#10b981" }}>INR {r.rcost}</span>
                            </div>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>Inquire</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Link to={`/editretreat/${r._id}`} className="btn-edit-ys">
                              <MdEdit /> Edit
                            </Link>
                            <button onClick={() => handleDelete(r._id)} className="btn-danger-ys">
                              <MdDelete /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Listretreat;
