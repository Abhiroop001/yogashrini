// Frontend/src/pages/Retreat.tsx
// Compact Retreats Directory with Isolated Card Expansion & Razorpay Reservation Flow
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Retreat.css";
import { GiLotus } from "react-icons/gi";
import {
  MdCalendarToday,
  MdLocationOn,
  MdSelfImprovement,
  MdCurrencyRupee,
  MdNotes,
  MdExpandMore,
  MdExpandLess,
  MdArrowForward,
  MdClose,
  MdCheckCircle,
  MdPayment,
} from "react-icons/md";
import { Retreat as RetreatType } from "../types";
import { useAuth } from "../AuthContext";
import { API_BASE, authFetch, loadRazorpayScript } from "../utils/api";

function formatINR(rawCost?: string | number): string {
  if (rawCost === undefined || rawCost === null || rawCost === "") return "Contact for package details";
  const str = String(rawCost).trim();
  const num = Number(str.replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(num) && num > 0 && /^\d+(\.\d+)?$/.test(str.replace(/[, ₹INR]/gi, ""))) {
    return `₹${num.toLocaleString("en-IN")}`;
  }
  return str.startsWith("₹") || /inr/i.test(str) ? str : `₹${str}`;
}

interface RetreatCardProps {
  retreat: RetreatType;
  onBook: (r: RetreatType) => void;
}

const RetreatCard: React.FC<RetreatCardProps> = ({ retreat, onBook }) => {
  const [open, setOpen] = useState(false);
  const short =
    retreat.rshort ||
    (retreat.ractivities ? retreat.ractivities.split(",").slice(0, 2).join(", ") : "A restorative retreat in nature.");

  return (
    <motion.article
      className="retreat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h4 className="retreat-card-title mb-0">{retreat.rname || "Immersive Yoga Retreat"}</h4>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-2">
          <span className="badge-pill badge-primary">
            <MdCalendarToday size={13} /> {retreat.rdate || "Upcoming"}
          </span>
          <span className="badge-pill badge-accent">
            <MdLocationOn size={13} /> {retreat.rlocation || "Sanctuary"}
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
            {open ? (
              <>
                <MdExpandLess size={18} /> Hide Details
              </>
            ) : (
              <>
                <MdExpandMore size={18} /> View Curriculum & Logistics
              </>
            )}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                className="retreat-details-box mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-start gap-2">
                    <MdSelfImprovement style={{ color: "var(--brand-primary)" }} className="flex-shrink-0 mt-1" size={16} />
                    <div>
                      <strong>Activities:</strong> {retreat.ractivities || "Yoga, meditation, breathwork, nature walks"}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <MdCurrencyRupee className="text-success flex-shrink-0" size={16} />
                    <div>
                      <strong>Package:</strong> {formatINR(retreat.rcost)}
                    </div>
                  </div>
                  {retreat.rother && (
                    <div className="d-flex align-items-start gap-2">
                      <MdNotes className="text-secondary flex-shrink-0 mt-1" size={16} />
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
        <button type="button" onClick={() => onBook(retreat)} className="btn btn-primary btn-sm flex-grow-1">
          Reserve Seat <MdArrowForward size={14} />
        </button>
        <NavLink
          to={`/contact?product=${encodeURIComponent(retreat.rname || "Yoga Retreat")}`}
          className="btn btn-secondary btn-sm"
        >
          Inquire
        </NavLink>
      </div>
    </motion.article>
  );
};

export const Retreat: React.FC = () => {
  const { user } = useAuth();
  const [retreats, setRetreats] = useState<RetreatType[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingRetreat, setBookingRetreat] = useState<RetreatType | null>(null);
  const [customerName, setCustomerName] = useState<string>(user?.name || "");
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [guests, setGuests] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);
  const [bookingErr, setBookingErr] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name && !customerName) setCustomerName(user.name);
    if (user?.email && !customerEmail) setCustomerEmail(user.email);
  }, [user?.name, user?.email]);

  useEffect(() => {
    fetch(`${API_BASE}/retreat/sel`)
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

  const numericPrice = (r: RetreatType | null) => {
    if (!r?.rcost) return 0;
    return Math.max(0, parseFloat(String(r.rcost).replace(/[^0-9.]/g, "")) || 0);
  };

  const handleReserve = async (e: React.FormEvent, useOnlinePay: boolean) => {
    e.preventDefault();
    if (!bookingRetreat?._id || !customerName.trim() || !customerPhone.trim()) {
      setBookingErr("Name and phone number are required.");
      return;
    }

    setSubmitting(true);
    setBookingErr(null);

    try {
      const unitCost = numericPrice(bookingRetreat);
      if (useOnlinePay && unitCost > 0) {
        const orderResp = await authFetch("/retreat/create-payment-order", {
          method: "POST",
          body: JSON.stringify({
            retreatId: bookingRetreat._id,
            customerName,
            customerEmail,
            customerPhone,
            guests,
          }),
        });
        const orderData = await orderResp.json();
        if (!orderResp.ok) throw new Error(orderData.error || "Unable to initiate retreat checkout");

        const sdkReady = await loadRazorpayScript();
        if (!sdkReady || !(window as any).Razorpay) {
          throw new Error("Could not load Razorpay Checkout SDK");
        }

        const rz = new (window as any).Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Yogashrini Retreats",
          description: `${bookingRetreat.rname} (${guests} guest${guests > 1 ? "s" : ""})`,
          order_id: orderData.orderId,
          handler: async (rzResp: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const vResp = await authFetch("/retreat/verify-payment", {
                method: "POST",
                body: JSON.stringify({ ...rzResp, bookingId: orderData.bookingId }),
              });
              const vData = await vResp.json();
              if (!vResp.ok) throw new Error(vData.error || "Payment verification failed");
              setBookingMsg(vData.msg || "Retreat seat confirmed via Razorpay!");
              setTimeout(() => {
                setBookingRetreat(null);
                setBookingMsg(null);
              }, 2400);
            } catch (err: any) {
              setBookingErr(err.message || "Payment verification failed");
            } finally {
              setSubmitting(false);
            }
          },
          prefill: { name: customerName, email: customerEmail, contact: customerPhone },
          theme: { color: "#FF2D6F" },
          modal: { ondismiss: () => setSubmitting(false) },
        });
        rz.on("payment.failed", (evt: any) => {
          setBookingErr(evt?.error?.description || "Payment declined");
          setSubmitting(false);
        });
        rz.open();
        return;
      }

      const resp = await authFetch("/retreat/book", {
        method: "POST",
        body: JSON.stringify({
          retreatId: bookingRetreat._id,
          customerName,
          customerEmail,
          customerPhone,
          guests,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Booking failed");

      setBookingMsg(data.msg || "Retreat reservation recorded!");
      setTimeout(() => {
        setBookingRetreat(null);
        setBookingMsg(null);
      }, 2400);
    } catch (err: any) {
      setBookingErr(err.message || "Unable to complete retreat reservation");
    } finally {
      if (!useOnlinePay) setSubmitting(false);
    }
  };

  return (
    <div className="retreat-page">
      {/* Compact Hero Header */}
      <motion.header
        className="ud-hero-section mb-3"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="yoga-container">
          <div className="d-flex align-items-center gap-3">
            <div className="ud-ai-badge-icon">
              <GiLotus size={24} />
            </div>
            <div>
              <h1 className="m-0 fs-3 fw-bold">Immersive Yoga & Wellness Retreats</h1>
              <p className="text-secondary small m-0 mt-1">
                Step away from daily demands. Reconnect with inner stillness in carefully chosen natural sanctuaries.
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="yoga-container">
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
              <RetreatCard
                key={r._id || idx}
                retreat={r}
                onBook={(ret) => {
                  setBookingRetreat(ret);
                  setBookingMsg(null);
                  setBookingErr(null);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Retreat Booking Modal */}
      <AnimatePresence>
        {bookingRetreat && (
          <div className="ud-modal-backdrop">
            <motion.div
              className="ud-modal-content"
              style={{ maxWidth: 480 }}
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
            >
              <div className="ud-modal-header">
                <h5 className="fw-bold mb-0 fs-6 d-flex align-items-center gap-2">
                  <GiLotus style={{ color: "var(--brand-primary)" }} /> Reserve Retreat Cohort
                </h5>
                <button
                  type="button"
                  className="ud-modal-close-btn"
                  onClick={() => setBookingRetreat(null)}
                  aria-label="Close retreat booking dialog"
                >
                  <MdClose size={20} />
                </button>
              </div>
              <div className="ud-modal-body">
                {bookingMsg ? (
                  <div className="text-center py-4">
                    <MdCheckCircle className="text-success mb-2" size={48} />
                    <h5 className="fw-bold text-success mb-1">Reservation Confirmed</h5>
                    <p className="text-muted small m-0">{bookingMsg}</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleReserve(e, numericPrice(bookingRetreat) > 0)}>
                    <div
                      className="p-3 rounded-3 mb-3 small"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
                    >
                      <div className="fw-bold">{bookingRetreat.rname}</div>
                      <div className="text-secondary mt-1">
                        {bookingRetreat.rdate} · {bookingRetreat.rlocation}
                      </div>
                      <div className="fw-bold mt-1" style={{ color: "var(--brand-primary)" }}>
                        {formatINR(bookingRetreat.rcost)} per guest
                      </div>
                    </div>

                    {bookingErr && <div className="alert alert-danger py-2 small mb-3">{bookingErr}</div>}

                    <div className="row g-2 mb-3">
                      <div className="col-8">
                        <label htmlFor="ret-name" className="form-label small fw-bold">Full Name *</label>
                        <input
                          id="ret-name"
                          name="customerName"
                          type="text"
                          required
                          className="form-control form-control-sm"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div className="col-4">
                        <label htmlFor="ret-guests" className="form-label small fw-bold">Guests</label>
                        <input
                          id="ret-guests"
                          name="guests"
                          type="number"
                          min="1"
                          max="10"
                          className="form-control form-control-sm"
                          value={guests}
                          onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label htmlFor="ret-phone" className="form-label small fw-bold">Phone *</label>
                        <input
                          id="ret-phone"
                          name="customerPhone"
                          type="tel"
                          required
                          className="form-control form-control-sm"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                      <div className="col-6">
                        <label htmlFor="ret-email" className="form-label small fw-bold">Email</label>
                        <input
                          id="ret-email"
                          name="customerEmail"
                          type="email"
                          className="form-control form-control-sm"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="d-flex gap-2 justify-content-end pt-2 flex-wrap">
                      <button
                        type="button"
                        disabled={submitting}
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => handleReserve(e as any, false)}
                      >
                        Hold Inquiry Spot
                      </button>
                      {numericPrice(bookingRetreat) > 0 && (
                        <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                          <MdPayment size={15} />{" "}
                          {submitting
                            ? "Processing..."
                            : `Pay ₹${(numericPrice(bookingRetreat) * guests).toLocaleString("en-IN")}`}
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Retreat;
