// src/pages/About.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import "./About.css";
import { GiLotus, GiMeditation } from "react-icons/gi";
import { MdCheckCircle, MdSchool, MdFavorite, MdSelfImprovement } from "react-icons/md";

export const About: React.FC = () => {
  return (
    <div className="about-page">
      {/* Hero Header */}
      <motion.div
        className="ud-hero-section mb-4"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="yoga-container">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="ud-ai-badge-icon">
                <GiLotus size={28} />
              </div>
              <div>
                <h1 className="m-0 fs-3 fw-bold">About Yogashrini Yoga School</h1>
                <p className="text-secondary small m-0 mt-1">
                  A sanctuary for self-discovery blending classical yogic lineages with movement science.
                </p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <NavLink className="btn btn-primary btn-sm" to="/training">
                Explore Store
              </NavLink>
              <NavLink className="btn btn-secondary btn-sm" to="/contact">
                Connect With Us
              </NavLink>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="yoga-container">
        {/* Core Pillars */}
        <div className="row g-4 mb-5">
          <div className="col-12 col-md-6">
            <motion.article
              className="about-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="contact-icon-circle">
                  <MdSchool size={22} />
                </div>
                <h3 className="fw-bold mb-0 fs-5">Our Mission & Lineage</h3>
              </div>
              <p className="text-secondary small mb-2">
                At Yogashrini Yoga School, we embrace yoga not merely as physical exercise, but as an ancient
                science of conscious living. Our journey began with a mission to deliver authentic, heart-centered
                classical yoga to practitioners from all walks of life.
              </p>
              <p className="text-secondary small mb-0">
                Rooted in Patanjali's Yoga Sutras and classical Hatha traditions, our curriculum integrates
                somatic asana alignment, pranayama breath regulation, and meditative absorption.
              </p>
            </motion.article>
          </div>

          <div className="col-12 col-md-6">
            <motion.article
              className="about-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="contact-icon-circle" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <MdFavorite size={22} />
                </div>
                <h3 className="fw-bold mb-0 fs-5">Inclusivity & Community</h3>
              </div>
              <p className="text-secondary small mb-2">
                Yoga at Yogashrini is accessible to all individuals - regardless of age, flexibility, or athletic background.
                We cultivate a safe, welcoming sanctuary with tailored progressions for beginners, intermediate practitioners,
                and aspiring teachers.
              </p>
              <p className="text-secondary small mb-0">
                Through small-batch studio sessions, immersive nature retreats, and AI-assisted biomechanical feedback, we
                empower every student on their personal path of well-being.
              </p>
            </motion.article>
          </div>
        </div>

        {/* Values Callout */}
        <div className="card p-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="contact-icon-circle" style={{ background: "rgba(124, 58, 237, 0.12)", color: "var(--brand-accent)" }}>
              <MdSelfImprovement size={22} />
            </div>
            <h4 className="fw-bold mb-0 fs-5">The Yogashrini Philosophy</h4>
          </div>
          <p className="text-secondary small mb-0">
            We believe that regular practice should invigorate both the nervous system and the musculoskeletal frame. By marrying
            ancient breath awareness with contemporary kinesiological injury-prevention protocols, students build resilient,
            balanced, and peaceful bodies and minds.
          </p>
        </div>
      </main>
    </div>
  );
};

export default About;
