const Razorpay    = require("razorpay");
const crypto      = require("crypto");
const Enrollment  = require("../db/enrollmentdb");
const Course      = require("../db/coursedb");
const Week        = require("../db/weekdb");

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay API keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/* ── POST /payment/create-order ──────────────────────────────────── */
exports.createOrder = async (req, res) => {
  try {
    const { courseId, userId } = req.body;

    // Guard: both required and userId must not be "null" string
    if (!courseId || !userId || userId === "null" || userId === "undefined") {
      return res.status(400).json({ error: "Please log in to enroll in a course." });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Check if already enrolled
    const existing = await Enrollment.findOne({ userId, courseId });
    if (existing && existing.isPaid) {
      return res.status(409).json({ error: "Already enrolled in this course" });
    }

    // Free course → auto-enroll
    if (course.price === 0) {
      const enrollment = await Enrollment.findOneAndUpdate(
        { userId, courseId },
        { isPaid: true, purchasedAt: new Date() },
        { upsert: true, new: true }
      );
      return res.json({ free: true, enrollment });
    }

    const razorpay = getRazorpay();
    // Receipt must be <= 40 chars for Razorpay
    const shortId  = userId.slice(-6) + courseId.slice(-6);
    const receipt  = `rcpt_${shortId}_${Date.now().toString(36)}`;
    const options  = {
      amount:   course.price * 100,   // paise
      currency: "INR",
      receipt,
      notes:    { courseId, userId },
    };

    const order = await razorpay.orders.create(options);

    // Save pending enrollment with orderId
    await Enrollment.findOneAndUpdate(
      { userId, courseId },
      { orderId: order.id, isPaid: false },
      { upsert: true, new: true }
    );

    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
      courseName: course.title,
    });
  } catch (e) {
    console.error("[createOrder ERROR]", e.message, e.statusCode, JSON.stringify(e.error || {}));
    res.status(500).json({ error: e.message || "Internal error", details: e.error || {} });
  }
};

/* ── POST /payment/verify ────────────────────────────────────────── */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, userId } = req.body;

    const body       = razorpay_order_id + "|" + razorpay_payment_id;
    const expected   = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed – invalid signature" });
    }

    // Mark enrollment as paid
    const enrollment = await Enrollment.findOneAndUpdate(
      { userId, courseId },
      { isPaid: true, paymentId: razorpay_payment_id, purchasedAt: new Date() },
      { new: true }
    );

    res.json({ message: "Payment verified. Enrollment confirmed.", enrollment });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ── GET /enrollment/check/:courseId?userId=... ──────────────────── */
exports.checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId }   = req.query;
    const enrollment   = await Enrollment.findOne({ userId, courseId });
    res.json({ enrolled: !!(enrollment && enrollment.isPaid), enrollment });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ── GET /enrollment/my?userId=... ──────────────────────────────── */
exports.myEnrollments = async (req, res) => {
  try {
    const { userId } = req.query;
    const enrollments = await Enrollment.find({ userId, isPaid: true })
      .populate("courseId");
    res.json({ enrollments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ── POST /enrollment/complete-week ─────────────────────────────── */
exports.completeWeek = async (req, res) => {
  try {
    const { userId, courseId, weekNumber } = req.body;

    const enrollment = await Enrollment.findOne({ userId, courseId, isPaid: true });
    if (!enrollment) return res.status(403).json({ error: "Not enrolled" });

    if (enrollment.completedWeeks.includes(weekNumber)) {
      return res.json({ message: "Already completed", enrollment });
    }

    const week = await Week.findOne({ courseId, weekNumber });
    if (!week) return res.status(404).json({ error: "Week not found" });

    enrollment.completedWeeks.push(weekNumber);
    enrollment.totalXP     += week.bonusXP;
    enrollment.totalPoints += week.bonusPoints;

    // Check if all regular weeks done → unlock bonus
    const course  = await Course.findById(courseId);
    const allWeeksDone = enrollment.completedWeeks.length >= course.totalWeeks;
    if (allWeeksDone) enrollment.bonusUnlocked = true;

    await enrollment.save();
    res.json({
      message: "Week completed!",
      xpEarned:      week.bonusXP,
      pointsEarned:  week.bonusPoints,
      bonusUnlocked: enrollment.bonusUnlocked,
      enrollment,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ── GET /enrollment/stats?userId=... (for admin dashboard) ─────── */
exports.enrollmentStats = async (req, res) => {
  try {
    const total     = await Enrollment.countDocuments({ isPaid: true });
    const revenue   = await Enrollment.aggregate([
      { $match: { isPaid: true } },
      { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
      { $unwind: "$course" },
      { $group: { _id: null, total: { $sum: "$course.price" } } },
    ]);
    res.json({
      totalEnrollments: total,
      totalRevenue:     revenue[0]?.total || 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
