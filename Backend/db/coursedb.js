const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true, default: 0 },
    thumbnail:   { type: String, default: "" },           // filename stored in public/thumbnails
    totalWeeks:  { type: Number, required: true, default: 1 },
    level:       { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    isPublished: { type: Boolean, default: false },
    instructor:  { type: String, default: "Yogashrini Team" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
