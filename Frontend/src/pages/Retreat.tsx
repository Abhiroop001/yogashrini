// src/pages/Retreat.tsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Retreat.css";
import { GiLotus } from "react-icons/gi";
import {
  MdCalendarToday,
  MdLocationOn,
  MdSelfImprovement,
  MdAttachMoney,
  MdNotes,
  MdExpandMore,
  MdExpandLess,
  MdArrowForward,
} from "react-icons/md";
import { Retreat as RetreatType } from "../types";

const API = "http://localhost:2000";

interface RetreatCardProps {
  retreat: RetreatType;
}

const RetreatCard: React.FC<RetreatCardProps> = ({ retreat }) => {
  const [open, setOpen] = useState(false);
  const short = retreat.rshort || (retreat.ractivities ? retreat.ractivities.split(",").slice(0, 2).join(", ") : "A restorative retreat in nature.");

  return (
    <motion.article
      className="retreat-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h4 className="retreat-card-title mb-0">{retreat.rname || "Immersive Yoga Retreat"}</h4>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge-pill badge-primary">
            <MdCalendarToday size={14} /> {retreat.rdate || "Upcoming"}
          </span>
          <span className="badge-pill badge-accent">
            <MdLocationOn size={14} /> {retreat.rlocation || "Sanctuary"}
          </span>
        </div>

        <p className="text-secondary small mb-3">{short}</p>

        {/* Collapsible Details */}
        <div className="mb-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm p-0 d-flex align-items-center gap-1 fw-bold"
            style={{ color: "var(--brand-primary)" }}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <><MdExpandLess size={18} /> Hide Details</> : <><MdExpandMore size={18} /> View Curriculum & Logistics</>}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                className="retreat-details-box mt-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <MdSelfImprovement style={{ color: "var(--brand-primary)" }} className="flex-shrink-0" size={16} />
                    <div>
                      <strong>Activities:</strong> {retreat.ractivities || "Yoga, meditation, breathwork, nature walks"}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <MdAttachMoney className="text-success flex-shrink-0" size={16} />
                    <div>
                      <strong>Cost:</strong> {retreat.rcost || "Contact for package details"}
                    </div>
                  </div>
                  {retreat.rother && (
                    <div className="d-flex align-items-center gap-2">
                      <MdNotes className="text-secondary flex-shrink-0" size={16} />
                      <div>
                        <strong>Notes:</strong> {retreat.rother}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="pt-3 border-top d-flex gap-2">
        <NavLink to="/contact" className="btn btn-primary btn-sm w-100">
          Inquire & Book <MdArrowForward size={14} />
        </NavLink>
      </div>
    </motion.article>
  );
};

export const Retreat: React.FC = () => {
  const [retreats, setRetreats] = useState<RetreatType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/retreat/sel`)
      .then((res) => res.json())
      .then((data) => {
        setRetreats(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load retreats:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="retreat-page">
      {/* Hero Header */}
      <motion.div
        className="ud-hero-section mb-4"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="yoga-container">
          <div className="d-flex align-items-center gap-3">
            <div className="ud-ai-badge-icon">
              <GiLotus size={28} />
            </div>
            <div>
              <h1 className="m-0 fs-3 fw-bold">Immersive Yoga & Wellness Retreats</h1>
              <p className="text-secondary small m-0 mt-1">
                Step away from daily demands. Reconnect with inner stillness in carefully chosen natural sanctuaries.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="yoga-container">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2 small">Loading retreats...</p>
          </div>
        ) : retreats.length === 0 ? (
          <div className="card text-center p-5">
            <h5 className="fw-bold mb-2">No Scheduled Retreats</h5>
            <p className="text-muted small mb-3">New immersion dates will be announced shortly.</p>
            <div>
              <NavLink to="/contact" className="btn btn-secondary btn-sm">
                Join Waitlist
              </NavLink>
            </div>
          </div>
        ) : (
          <div className="retreat-grid">
            {retreats.map((r, idx) => (
              <RetreatCard key={r._id || idx} retreat={r} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Retreat;
