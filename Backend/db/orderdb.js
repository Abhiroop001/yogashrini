const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId:        { type: String, default: null },
    productId:     { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName:   { type: String, required: true },
    productPrice:  { type: Number, default: 0 },
    quantity:      { type: Number, default: 1 },
    totalAmount:   { type: Number, default: 0 },
    currency:      { type: String, default: "INR" },
    customerName:  { type: String, required: true },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, required: true },
    address:       { type: String, default: "" },
    notes:         { type: String, default: "" },
    status:        { type: String, default: "Pending" }, // Pending, Confirmed, Shipped, Delivered, Cancelled
    paymentMethod: { type: String, default: "COD / Direct Inquiry" }, // Razorpay Online | COD / Direct Inquiry
    orderId:       { type: String, default: "" },
    paymentId:     { type: String, default: "" },
    isPaid:        { type: Boolean, default: false },
    paidAt:        { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductOrder", orderSchema);
