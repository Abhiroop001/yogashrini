const mongoose = require("mongoose");

const retreatBookingSchema = new mongoose.Schema(
  {
    retreatId:     { type: mongoose.Schema.Types.ObjectId, ref: "Retreat", required: true },
    retreatName:   { type: String, required: true },
    userId:        { type: String, default: null },
    customerName:  { type: String, required: true },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, required: true },
    guests:        { type: Number, default: 1 },
    totalAmount:   { type: Number, default: 0 },
    currency:      { type: String, default: "INR" },
    notes:         { type: String, default: "" },
    orderId:       { type: String, default: "" },
    paymentId:     { type: String, default: "" },
    isPaid:        { type: Boolean, default: false },
    paymentMethod: { type: String, default: "Inquiry" },
    status:        { type: String, default: "Pending" },
    paidAt:        { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RetreatBooking", retreatBookingSchema);
