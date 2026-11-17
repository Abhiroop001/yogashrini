import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
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
  const key = retreat._id || retreat.rname?.replace(/\s+/g, "-").toLowerCase() || Math.random().toString(36).slice(2, 9);
  const short = retreat.rshort || (retreat.ractivities ? retreat.ractivities.split(",").slice(0, 2).join(", ") : "A restorative retreat in nature.");

  return (
    <motion.article
      className="card border-0 rounded-4 shadow-sm p-4 h-100 d-flex flex-column justify-content-between hover-lift bg-white"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h4 className="fw-bold text-dark mb-0">{retreat.rname || "Immersive Yoga Retreat"}</h4>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 small d-flex align-items-center gap-1">
            <MdCalendarToday /> {retreat.rdate || "Upcoming"}
          </span>
          <span className="badge bg-light text-muted border rounded-pill px-3 py-1 small d-flex align-items-center gap-1">
            <MdLocationOn /> {retreat.rlocation || "Sanctuary"}
          </span>
        </div>

        <p className="text-muted small mb-3">{short}</p>

        {/* Collapsible Details */}
        <div className="mb-3">
          <button
            type="button"
            className="btn btn-sm btn-link p-0 text-decoration-none d-flex align-items-center gap-1 fw-bold text-primary"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <><MdExpandLess /> Less Details</> : <><MdExpandMore /> View Curriculum & Logistics</>}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                className="mt-3 p-3 bg-light rounded-3 small"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <MdSelfImprovement className="text-primary flex-shrink-0" />
                    <div>
                      <strong>Activities:</strong> {retreat.ractivities || "Yoga, meditation, breathwork, nature walks"}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <MdAttachMoney className="text-success flex-shrink-0" />
                    <div>
                      <strong>Cost:</strong> {retreat.rcost || "Contact for package details"}
                    </div>
                  </div>
                  {retreat.rother && (
                    <div className="d-flex align-items-center gap-2">
                      <MdNotes className="text-secondary flex-shrink-0" />
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
        <NavLink to="/contact" className="btn btn-primary rounded-pill px-4 flex-grow-1 d-flex align-items-center justify-content-center gap-2">
          Inquire to Book <MdArrowForward />
        </NavLink>
      </div>
    </motion.article>
  );
};

export const Retreat: React.FC = () => {
  const [retreats, setRetreats] = useState<RetreatType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getRetreats = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`${API}/retreat/sel`);
      if (!resp.ok) throw new Error(`Server responded ${resp.status}`);
      const data = await resp.json();
      setRetreats(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load retreats. Please try again later.");
      setRetreats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRetreats();
  }, []);

  return (
    <>
      <Navbar />

      <motion.header
        className="ud-hero mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="ud-hero-inner container">
          <div className="ud-hero-left">
            <GiLotus size={72} className="posture-hero-icon" style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
            <div className="ud-hero-title-wrap">
              <h1 className="ud-title">Holistic Yoga & Meditation Retreats</h1>
              <p className="ud-subtitle">
                Soulful journeys merging intensive classical yogic discipline with pristine natural sanctuaries.
                Immerse in silent contemplation, masterclasses, and rejuvenation.
              </p>
              <div className="posture-hero-badges">
                <span className="posture-badge">Nature Sanctuaries</span>
                <span className="posture-badge">Satvik Organic Cuisine</span>
                <span className="posture-badge">Certified Master Guides</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0 text-dark">Upcoming Retreat Schedules</h3>
          <span className="badge bg-light text-muted border px-3 py-2 rounded-pill small">
            {retreats.length} available journeys
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2 small">Gathering retreat itineraries...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger rounded-4 p-4 text-center">{error}</div>
        ) : retreats.length === 0 ? (
          <div className="card border-0 rounded-4 shadow-sm p-5 text-center bg-white">
            <h5 className="fw-bold mb-2">No active retreats scheduled</h5>
            <p className="text-muted small mb-4">
              Seasonal retreat cohorts will be published soon. Contact our concierge for private group reservations.
            </p>
            <div>
              <NavLink to="/contact" className="btn btn-primary rounded-pill px-4">
                Contact Concierge
              </NavLink>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {retreats.map((r) => (
              <div key={r._id || r.rname} className="col-12 col-md-6 col-lg-4">
                <RetreatCard retreat={r} />
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Retreat;
