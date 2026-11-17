import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Contact.css";
import Navbar from "../inc/Navbar";
import Footer from "../inc/Footer";
import { FaWhatsapp, FaEnvelope, FaPhoneAlt, FaInstagram } from "react-icons/fa";
import { MdSend, MdCheckCircle, MdLocationOn } from "react-icons/md";
import { GiLotus } from "react-icons/gi";

export const Contact: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialProduct = searchParams.get("product") || location.state?.productName || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: initialProduct ? `Inquiry regarding ${initialProduct}` : "General Inquiry",
    message: initialProduct ? `Hello Yogashrini, I would like to inquire about ${initialProduct}.` : "",
  });

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
    `Hello Yogashrini! My name is ${form.name || "[Name]"}. Subject: ${form.subject}. Message: ${form.message}`
  )}`;

  return (
    <>
      <Navbar />

      <main className="contact-container container py-5" role="main">
        <motion.header
          className="text-center mb-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="d-inline-flex align-items-center gap-2 mb-2">
            <GiLotus size={44} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
            <h1 className="fw-bold mb-0 text-dark">Contact Yogashrini</h1>
          </div>
          <p className="text-muted lead fs-6">
            We are here to support your practice. Connect with our instructors for inquiries regarding classes,
            retreats, products, or teacher certifications.
          </p>
        </motion.header>

        <div className="row g-4 mb-5">
          {/* Details Card */}
          <div className="col-12 col-md-6">
            <motion.div
              className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="fw-bold text-dark mb-4">Direct Contact Concierge</h4>
              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary">
                    <FaEnvelope size={20} />
                  </div>
                  <div>
                    <div className="text-muted small">Email Address</div>
                    <a href="mailto:hello@yogashrini.com" className="fw-bold text-decoration-none text-dark">
                      hello@yogashrini.com
                    </a>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success">
                    <FaPhoneAlt size={20} />
                  </div>
                  <div>
                    <div className="text-muted small">Phone Contact</div>
                    <a href="tel:+919876543210" className="fw-bold text-decoration-none text-dark">
                      +91 98765 43210
                    </a>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success">
                    <FaWhatsapp size={20} />
                  </div>
                  <div>
                    <div className="text-muted small">WhatsApp Support</div>
                    <a
                      href="https://wa.me/919876543210"
                      target="_blank"
                      rel="noreferrer"
                      className="fw-bold text-decoration-none text-dark"
                    >
                      +91 98765 43210
                    </a>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 rounded-circle bg-danger bg-opacity-10 text-danger">
                    <FaInstagram size={20} />
                  </div>
                  <div>
                    <div className="text-muted small">Instagram</div>
                    <a
                      href="https://instagram.com/yogashrini"
                      target="_blank"
                      rel="noreferrer"
                      className="fw-bold text-decoration-none text-dark"
                    >
                      @yogashrini
                    </a>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-auto pt-3 border-top">
                <button
                  className="btn btn-primary rounded-pill px-4 flex-grow-1"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? "Hide Message Form" : "Send Us a Message"}
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-success rounded-pill px-4 d-inline-flex align-items-center gap-2"
                >
                  <FaWhatsapp /> Chat Now
                </a>
              </div>
            </motion.div>
          </div>

          {/* Centers Card */}
          <div className="col-12 col-md-6">
            <motion.div
              className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h4 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <MdLocationOn className="text-primary" /> Studio Sanctuaries
              </h4>

              <h6 className="fw-bold text-muted small text-uppercase mb-3">Operating Centers</h6>
              <div className="table-responsive mb-4">
                <table className="table table-borderless table-striped small align-middle">
                  <thead>
                    <tr className="text-muted">
                      <th>City</th>
                      <th>State</th>
                      <th>Center Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-bold">Kolkata</td>
                      <td>West Bengal</td>
                      <td><span className="badge bg-success rounded-pill px-2">Main Campus</span></td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Bangalore</td>
                      <td>Karnataka</td>
                      <td><span className="badge bg-primary rounded-pill px-2">Active Studio</span></td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Rishikesh</td>
                      <td>Uttarakhand</td>
                      <td><span className="badge bg-info text-dark rounded-pill px-2">Retreat Sanctuary</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h6 className="fw-bold text-muted small text-uppercase mb-2">Upcoming Expansions</h6>
              <div className="d-flex gap-2 flex-wrap">
                {["Mumbai", "Pune", "Hyderabad", "Delhi NCR"].map((city) => (
                  <span key={city} className="badge bg-light text-muted border rounded-pill px-3 py-2 small">
                    {city} (Cohort 2026)
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Inquiry Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="card border-0 rounded-4 shadow-sm p-4 bg-white"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="fw-bold text-dark mb-3">Send an Inquiry</h4>

              {submitted ? (
                <div className="text-center py-5">
                  <MdCheckCircle className="text-success mb-2" size={48} />
                  <h4 className="fw-bold text-success">Message Dispatched</h4>
                  <p className="text-muted small">
                    Thank you, {form.name}. Our teaching faculty will reach out to you within 24 hours.
                  </p>
                  <button
                    className="btn btn-outline-primary rounded-pill px-4 mt-2"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" });
                    }}
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="form-control"
                        placeholder="Your name"
                        value={form.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="form-control"
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        placeholder="+91..."
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      className="form-control"
                      value={form.subject}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-bold">Message Details</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      className="form-control"
                      placeholder="Please share details about your practice goals or inquiry..."
                      value={form.message}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-light rounded-pill px-4"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary rounded-pill px-5 fw-bold d-flex align-items-center gap-2"
                    >
                      <MdSend /> {submitting ? "Sending..." : "Submit Message"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </>
  );
};

export default Contact;
