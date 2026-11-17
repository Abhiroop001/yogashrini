const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  filename:    { type: String, required: true },   // stored in public/videos/
  duration:    { type: String, default: "" },       // e.g. "12:45"
  order:       { type: Number, default: 0 },
});

const weekSchema = new mongoose.Schema(
  {
    courseId:    { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    weekNumber:  { type: Number, required: true },
    title:       { type: String, required: true },    // e.g. "Week 1 – Foundations"
    description: { type: String, default: "" },
    videos:      [videoSchema],
    bonusXP:     { type: Number, default: 50 },       // XP awarded on completing this week
    bonusPoints: { type: Number, default: 10 },       // bonus points awarded
    isBonus:     { type: Boolean, default: false },   // true = bonus week unlocked after all regular weeks
  },
  { timestamps: true }
);

module.exports = mongoose.model("Week", weekSchema);
