const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    productId:     { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName:   { type: String, required: true },
    productPrice:  { type: Number, default: 0 },
    quantity:      { type: Number, default: 1 },
    totalAmount:   { type: Number, default: 0 },
    customerName:  { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    address:       { type: String, default: "" },
    notes:         { type: String, default: "" },
    status:        { type: String, default: "Pending" }, // Pending, Confirmed, Shipped, Delivered, Cancelled
    paymentMethod: { type: String, default: "COD / Direct Inquiry" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductOrder", orderSchema);

