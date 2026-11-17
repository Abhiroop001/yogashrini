const mongoose = require("mongoose");

const ps = mongoose.Schema(
  {
    pname:         { type: String, required: true },
    pprice:        { type: Number, default: 0 },
    poriginalPrice:{ type: Number, default: 0 },
    pcategory:     { type: String, default: "General" },
    pstatus:       { type: String, default: "Available" },
    pstock:        { type: Number, default: 10 },
    prating:       { type: Number, default: 5 },
    pimg:          { type: String, default: "" },
    pdetails:      { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ps);