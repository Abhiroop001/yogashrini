// src/inc/Footer.tsx
import React from "react";
import { Link } from "react-router-dom";
import { MdSelfImprovement, MdEmail, MdPhone, MdLocationOn } from "react-icons/md";

const Footer: React.FC = () => {
  return (
    <footer className="footer-container" style={{ background: "#0f172a", color: "#94a3b8", padding: "40px 0 20px" }}>
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <MdSelfImprovement size={28} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
              <h5 className="mb-0 text-white fw-bold">Yogashrini</h5>
            </div>
            <p className="small mb-3">
              Classical Yoga School uniting traditional Hatha, Ashtanga, and Iyengar sciences with cutting-edge artificial intelligence and computer vision telemetry.
            </p>
          </div>
          <div className="col-lg-2 col-md-6">
            <h6 className="text-white fw-semibold mb-3">Navigation</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2">
              <li><Link to="/" className="text-decoration-none text-light">Home</Link></li>
              <li><Link to="/about" className="text-decoration-none text-light">About Us</Link></li>
              <li><Link to="/classes" className="text-decoration-none text-light">Classes</Link></li>
              <li><Link to="/courses" className="text-decoration-none text-light">Courses</Link></li>
              <li><Link to="/types" className="text-decoration-none text-light">Pose Library</Link></li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-semibold mb-3">AI Intelligence Suite</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2">
              <li><Link to="/live-trainer" className="text-decoration-none text-light">Real-Time AI Coach</Link></li>
              <li><Link to="/posture" className="text-decoration-none text-light">Image Posture Scan</Link></li>
              <li><Link to="/retreat" className="text-decoration-none text-light">Yoga Retreats</Link></li>
              <li><Link to="/training" className="text-decoration-none text-light">Teacher Training</Link></li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-semibold mb-3">Contact & Ashram</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2">
              <li className="d-flex align-items-center gap-2"><MdLocationOn /> Tapovan, Rishikesh, India</li>
              <li className="d-flex align-items-center gap-2"><MdEmail /> contact@yogashrini.com</li>
              <li className="d-flex align-items-center gap-2"><MdPhone /> +91 98765 43210</li>
            </ul>
          </div>
        </div>
        <hr style={{ borderColor: "rgba(255,255,255,0.1)" }} />
        <div className="d-flex justify-content-between align-items-center flex-wrap small text-muted">
          <span>(C) {new Date().getFullYear()} Yogashrini Yoga School. All rights reserved.</span>
          <span>GPU-Accelerated Movement Intelligence</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
