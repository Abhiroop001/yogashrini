const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    userId:          { type: String, required: true },           // stored as string for flexibility
    courseId:        { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    orderId:         { type: String, default: "" },              // Razorpay order_id
    paymentId:       { type: String, default: "" },              // Razorpay payment_id
    isPaid:          { type: Boolean, default: false },
    completedWeeks:  { type: [Number], default: [] },            // completed week numbers
    totalXP:         { type: Number, default: 0 },
    totalPoints:     { type: Number, default: 0 },
    bonusUnlocked:   { type: Boolean, default: false },
    purchasedAt:     { type: Date, default: null },
  },
  { timestamps: true }
);

// one enrollment per user per course
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
