// Server/controller/retreat_controller.js
const Retreat = require("../db/retreatdb");
const RetreatBooking = require("../db/retreatBookingdb");
const mongoose = require("mongoose");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
} = require("../services/razorpay_service");

function parseRetreatPrice(costStr) {
  if (typeof costStr === "number") return Math.max(0, costStr);
  if (!costStr) return 0;
  const numeric = String(costStr).replace(/[^0-9.]/g, "");
  return Math.max(0, parseFloat(numeric) || 0);
}

module.exports = {
  // POST /retreat/add or POST /retreat (Admin)
  async addretreat(req, res) {
    try {
      const { rname, rdate, rlocation, ractivities, rcost } = req.body;
      if (!rname || !String(rname).trim()) {
        return res.status(400).json({ error: "Retreat name (rname) is required" });
      }

      const retreat = await Retreat.create({
        rname: String(rname).trim(),
        rdate: rdate || "",
        rlocation: rlocation || "",
        ractivities: ractivities || "",
        rcost: rcost || ""
      });

      res.status(201).json({ msg: "Retreat Added", retreat });
    } catch (err) {
      console.error("[Retreat Controller] Add error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET /retreat/sel or GET /retreat
  async selretreat(req, res) {
    try {
      const data = await Retreat.find().sort({ _id: -1 });
      res.json(data);
    } catch (err) {
      console.error("[Retreat Controller] List error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // POST /retreat/del or DELETE /retreat/:id (Admin)
  async delretreat(req, res) {
    try {
      const id = req.params.id || req.body.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid retreat ID" });
      }

      const deleted = await Retreat.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Retreat not found" });
      }

      res.json({ msg: "Retreat Deleted", id });
    } catch (err) {
      console.error("[Retreat Controller] Delete error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // POST /retreat/edit or GET /retreat/:id
  async editretreat(req, res) {
    try {
      const id = req.params.id || req.body.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid retreat ID" });
      }

      const data = await Retreat.findById(id);
      if (!data) {
        return res.status(404).json({ error: "Retreat not found" });
      }

      res.json(data);
    } catch (err) {
      console.error("[Retreat Controller] Get error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // POST /retreat/upd or PUT /retreat/:id (Admin)
  async updretreat(req, res) {
    try {
      const id = req.params.id || req.body.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid retreat ID" });
      }

      const { rname, rdate, rlocation, ractivities, rcost } = req.body;
      const updates = { rname, rdate, rlocation, ractivities, rcost };

      const updated = await Retreat.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) {
        return res.status(404).json({ error: "Retreat not found" });
      }

      res.json({ msg: "Retreat Updated", retreat: updated });
    } catch (err) {
      console.error("[Retreat Controller] Update error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // POST /retreat/book — Inquiry reservation without upfront payment
  async bookRetreat(req, res) {
    try {
      const { retreatId, customerName, customerEmail, customerPhone, guests, notes } = req.body;
      if (!retreatId || !mongoose.Types.ObjectId.isValid(retreatId)) {
        return res.status(400).json({ error: "Valid retreatId is required" });
      }
      if (!customerName || !String(customerName).trim() || !customerPhone || !String(customerPhone).trim()) {
        return res.status(400).json({ error: "Name and phone number are required" });
      }

      const retreat = await Retreat.findById(retreatId);
      if (!retreat) return res.status(404).json({ error: "Retreat not found" });

      const guestCount = Math.max(1, parseInt(guests, 10) || 1);
      const unitPrice = parseRetreatPrice(retreat.rcost);
      const booking = await RetreatBooking.create({
        retreatId: retreat._id,
        retreatName: retreat.rname,
        userId: req.user?.id ? String(req.user.id) : null,
        customerName: String(customerName).trim(),
        customerEmail: customerEmail ? String(customerEmail).trim() : (req.user?.email || ""),
        customerPhone: String(customerPhone).trim(),
        guests: guestCount,
        totalAmount: unitPrice * guestCount,
        notes: notes ? String(notes).trim() : "",
        paymentMethod: "Inquiry Reservation",
        status: "Reserved",
      });

      res.status(201).json({ msg: "Retreat inquiry reserved! Our concierge will follow up.", booking });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /retreat/create-payment-order
  async createRetreatPaymentOrder(req, res) {
    try {
      const { retreatId, customerName, customerEmail, customerPhone, guests, notes } = req.body;
      if (!retreatId || !mongoose.Types.ObjectId.isValid(retreatId)) {
        return res.status(400).json({ error: "Valid retreatId is required" });
      }
      if (!customerName || !String(customerName).trim() || !customerPhone || !String(customerPhone).trim()) {
        return res.status(400).json({ error: "Name and phone number are required" });
      }

      const retreat = await Retreat.findById(retreatId);
      if (!retreat) return res.status(404).json({ error: "Retreat not found" });

      const guestCount = Math.max(1, parseInt(guests, 10) || 1);
      const unitPrice = parseRetreatPrice(retreat.rcost);
      const totalAmount = unitPrice * guestCount;
      if (totalAmount <= 0) {
        return res.status(400).json({ error: "Retreat pricing is set to inquiry-only. Use Reservation Inquiry." });
      }

      const orderInfo = await createRazorpayOrder({
        amountInINR: totalAmount,
        currency: "INR",
        receiptPrefix: `ret_${String(retreat._id).slice(-6)}`,
        notes: { type: "retreat_booking", retreatId: String(retreat._id), guests: String(guestCount) },
      });

      const booking = await RetreatBooking.create({
        retreatId: retreat._id,
        retreatName: retreat.rname,
        userId: req.user?.id ? String(req.user.id) : null,
        customerName: String(customerName).trim(),
        customerEmail: customerEmail ? String(customerEmail).trim() : (req.user?.email || ""),
        customerPhone: String(customerPhone).trim(),
        guests: guestCount,
        totalAmount,
        notes: notes ? String(notes).trim() : "",
        paymentMethod: "Razorpay Online",
        orderId: orderInfo.orderId,
        status: "Awaiting Payment",
        isPaid: false,
      });

      res.json({
        ...orderInfo,
        bookingId: booking._id,
        retreatName: retreat.rname,
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  },

  // POST /retreat/verify-payment
  async verifyRetreatPayment(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
      const valid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!valid) {
        return res.status(400).json({ error: "Payment verification failed - invalid signature." });
      }

      const query = { orderId: razorpay_order_id };
      if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
        query._id = bookingId;
      }

      const booking = await RetreatBooking.findOneAndUpdate(
        query,
        { isPaid: true, paymentId: razorpay_payment_id, status: "Confirmed", paidAt: new Date() },
        { new: true }
      );
      if (!booking) return res.status(404).json({ error: "Matching retreat booking not found." });

      res.json({ msg: "Retreat seat confirmed via Razorpay!", booking });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /retreat/bookings (Admin)
  async listBookings(req, res) {
    try {
      const bookings = await RetreatBooking.find().sort({ createdAt: -1 });
      res.json(bookings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
