import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
import "./About.css";
import { GiLotus, GiMeditation } from "react-icons/gi";
import { MdCheckCircle, MdSchool, MdFavorite, MdSelfImprovement } from "react-icons/md";

export const About: React.FC = () => {
  return (
    <>
      <Navbar />

      <main className="about-container" role="main">
        {/* Hero */}
        <motion.header
          className="about-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="about-hero-inner container">
            <div className="about-hero-left">
              <h1>About Yogashrini Yoga School</h1>
              <p className="lead">
                A sanctuary for self-discovery - blending classical yogic wisdom with modern movement intelligence,
                accessible to everyone.
              </p>

              <div className="about-cta d-flex gap-3">
                <NavLink className="btn btn-primary rounded-pill px-4" to="/training">
                  Explore Offerings
                </NavLink>
                <NavLink className="btn btn-outline-secondary rounded-pill px-4" to="/contact">
                  Connect With Us
                </NavLink>
              </div>
            </div>

            <div className="about-hero-right" aria-hidden="true">
              <div className="react-badge">
                <GiLotus size={56} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
                <div className="react-text">Yogashrini School</div>
                <div style={{ fontSize: "0.82rem", opacity: 0.7 }}>Est. 2013 - Kolkata</div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Pillars */}
        <section className="about-grid container py-5">
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <motion.article
                className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary">
                    <MdSchool size={28} />
                  </div>
                  <h3 className="fw-bold mb-0 text-dark">Our Mission & Lineage</h3>
                </div>
                <p className="text-muted">
                  At Yogashrini Yoga School, we embrace yoga not merely as physical exercise, but as an ancient
                  science of conscious living. Our journey began over a decade ago with a mission to deliver
                  authentic, heart-centered classical yoga to practitioners from all walks of life.
                </p>
                <p className="text-muted mb-0">
                  Rooted in the authentic traditions of Patanjali's Yoga Sutras and the Hatha Yoga Pradipika, our
                  curriculum integrates asana alignment, pranayama breath mastery, and deep meditative absorption.
                </p>
              </motion.article>
            </div>

            <div className="col-12 col-md-6">
              <motion.article
                className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success">
                    <MdFavorite size={28} />
                  </div>
                  <h3 className="fw-bold mb-0 text-dark">Inclusivity & Community</h3>
                </div>
                <p className="text-muted">
                  Yoga at Yogashrini is accessible to all individuals - regardless of age, flexibility, or athletic
                  background. We cultivate a safe, welcoming sanctuary with tailored progressions for beginners,
                  intermediate practitioners, and aspiring teachers.
                </p>
                <p className="text-muted mb-0">
                  Through small-batch studio sessions, immersive nature retreats, and AI-assisted bio-mechanical
                  feedback, we empower every student on their personal journey toward well-being.
                </p>
              </motion.article>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="bg-light py-5">
          <div className="container">
            <h3 className="fw-bold text-center mb-4 text-dark">Core Values We Live By</h3>
            <div className="row g-4 text-center">
              {[
                {
                  title: "Authentic Transmission",
                  desc: "Preserving pure yogic principles without compromise, validated by traditional texts.",
                },
                {
                  title: "Scientific Biomechanics",
                  desc: "Blending anatomical alignment and computer vision metrics for injury-free practice.",
                },
                {
                  title: "Holistic Well-being",
                  desc: "Harmonizing the body, breath, nervous system, and mind in every session.",
                },
              ].map((val, idx) => (
                <div key={idx} className="col-12 col-md-4">
                  <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white">
                    <div className="text-primary mb-3">
                      <MdCheckCircle size={32} />
                    </div>
                    <h5 className="fw-bold text-dark mb-2">{val.title}</h5>
                    <p className="text-muted small mb-0">{val.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default About;
