// src/pages/Contact.tsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Contact.css";
import { FaWhatsapp, FaEnvelope, FaPhoneAlt, FaInstagram } from "react-icons/fa";
import { MdSend, MdCheckCircle, MdLocationOn, MdSchedule } from "react-icons/md";
import { GiLotus } from "react-icons/gi";
import { useAuth } from "../AuthContext";

export const Contact: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialProduct = searchParams.get("product") || location.state?.productName || "";

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    subject: initialProduct ? `Inquiry regarding ${initialProduct}` : "General Inquiry",
    message: initialProduct ? `Hello Yogashrini, I would like to inquire about ${initialProduct}.` : "",
  });

  useEffect(() => {
    if (user?.name || user?.email) {
      setForm((f) => ({
        ...f,
        name: f.name || user?.name || "",
        email: f.email || user?.email || "",
      }));
    }
  }, [user?.name, user?.email]);

  const [showForm, setShowForm] = useState<boolean>(Boolean(initialProduct));
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (initialProduct) {
      setForm((f) => ({
        ...f,
        subject: `Inquiry regarding ${initialProduct}`,
        message: `Hello Yogashrini, I would like to inquire about ${initialProduct}.`,
      }));
      setShowForm(true);
    }
  }, [initialProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    `Hello Yogashrini! ${form.name ? `My name is ${form.name}. ` : ""}Subject: ${form.subject}. ${form.message || "I would like to connect with the sanctuary team."}`
  )}`;

  return (
    <div className="contact-page">
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
              <h1 className="m-0 fs-3 fw-bold">Contact Yogashrini Sanctuary</h1>
              <p className="text-secondary small m-0 mt-1">
                We are here to support your practice. Connect with our instructors for inquiries regarding classes, retreats, or teacher training.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="yoga-container">
        <div className="row g-4 mb-5">
          {/* Direct Concierge Card */}
          <div className="col-12 col-lg-6">
            <motion.div
              className="contact-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <h4 className="fw-bold mb-4 fs-5">Direct Concierge</h4>
                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="contact-icon-circle">
                      <FaEnvelope size={18} />
                    </div>
                    <div>
                      <div className="text-muted small">Email Address</div>
                      <a href="mailto:hello@yogashrini.com" className="fw-bold">
                        hello@yogashrini.com
                      </a>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <div className="contact-icon-circle" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                      <FaPhoneAlt size={16} />
                    </div>
                    <div>
                      <div className="text-muted small">Phone Contact</div>
                      <a href="tel:+919876543210" className="fw-bold">
                        +91 98765 43210
                      </a>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <div className="contact-icon-circle" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                      <FaWhatsapp size={18} />
                    </div>
                    <div>
                      <div className="text-muted small">WhatsApp Support</div>
                      <a
                        href="https://wa.me/919876543210"
                        target="_blank"
                        rel="noreferrer"
                        className="fw-bold"
                      >
                        +91 98765 43210
                      </a>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <div className="contact-icon-circle" style={{ background: "rgba(124, 58, 237, 0.12)", color: "var(--brand-accent)" }}>
                      <FaInstagram size={18} />
                    </div>
                    <div>
                      <div className="text-muted small">Instagram Community</div>
                      <a
                        href="https://instagram.com/yogashrini"
                        target="_blank"
                        rel="noreferrer"
                        className="fw-bold"
                      >
                        @yogashrini
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 pt-3 border-top flex-wrap">
                <button
                  className="btn btn-primary btn-sm flex-grow-1"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? "Hide Message Form" : "Send Us a Message"}
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm d-inline-flex align-items-center gap-1"
                >
                  <FaWhatsapp /> Chat WhatsApp
                </a>
              </div>
            </motion.div>
          </div>

          {/* Studio Sanctuaries Card */}
          <div className="col-12 col-lg-6">
            <motion.div
              className="contact-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div>
                <h4 className="fw-bold mb-4 fs-5 d-flex align-items-center gap-2">
                  <MdLocationOn style={{ color: "var(--brand-primary)" }} /> Studio Sanctuaries
                </h4>

                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="p-3 rounded-3" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong>Kolkata Sanctuary (Main Campus)</strong>
                      <span className="badge-pill badge-primary">Main Shala</span>
                    </div>
                    <div className="small text-secondary">
                      Salt Lake Sector V, Kolkata, West Bengal 700091
                    </div>
                    <div className="small text-muted mt-1 d-flex align-items-center gap-1">
                      <MdSchedule size={14} /> Open 06:00 AM - 08:30 PM (Daily)
                    </div>
                  </div>

                  <div className="p-3 rounded-3" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong>Rishikesh Meditation Ashram</strong>
                      <span className="badge-pill badge-emerald">Retreat Center</span>
                    </div>
                    <div className="small text-secondary">
                      Tapovan, Laxman Jhula Road, Rishikesh, Uttarakhand 249192
                    </div>
                    <div className="small text-muted mt-1 d-flex align-items-center gap-1">
                      <MdSchedule size={14} /> Seasonal Retreat Programs & Teacher Immersion
                    </div>
                  </div>
                </div>
              </div>

              <div className="small text-muted pt-3 border-top">
                Hybrid classes streamed simultaneously across all campuses.
              </div>
            </motion.div>
          </div>
        </div>

        {/* Message Form (Animated Dropdown) */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="card p-4 mb-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="fw-bold mb-3 fs-5">Send Message to Faculty</h4>
              {submitted ? (
                <div className="text-center py-4">
                  <MdCheckCircle className="text-success mb-2" size={48} />
                  <h5 className="fw-bold text-success mb-1">Inquiry Dispatched</h5>
                  <p className="text-muted small m-0">Thank you for reaching out. An instructor will reply within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="form-control"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="form-control"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+91..."
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      className="form-control"
                      value={form.subject}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Message *</label>
                    <textarea
                      name="message"
                      rows={4}
                      required
                      className="form-control"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Please specify your query or desired practice level..."
                    />
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      <MdSend size={16} /> {submitting ? "Sending..." : "Dispatch Message"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive Map Embed */}
        <div className="card p-3 overflow-hidden">
          <h5 className="fw-bold mb-3 fs-6 d-flex align-items-center gap-2">
            <MdLocationOn style={{ color: "var(--brand-primary)" }} /> Sanctuary Location
          </h5>
          <iframe
            title="Yogashrini Campus Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117925.21689694726!2d88.26495116719527!3d22.53556493699042!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f882db4908f667%3A0x43e330e68f6c2cbc!2sKolkata%2C%20West%20Bengal!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            className="contact-map-frame"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default Contact;
