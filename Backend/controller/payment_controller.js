// Server/controller/payment_controller.js
const mongoose    = require("mongoose");
const Enrollment  = require("../db/enrollmentdb");
const Course      = require("../db/coursedb");
const Week        = require("../db/weekdb");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
} = require("../services/razorpay_service");

/* ── POST /payment/create-order ──────────────────────────────────── */
exports.createOrder = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { courseId } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Valid courseId is required." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ userId, courseId });
    if (existing && existing.isPaid) {
      return res.status(409).json({ error: "Already enrolled in this course." });
    }

    const coursePrice = Math.max(0, Number(course.price) || 0);

    // Free course -> auto-enroll immediately
    if (coursePrice === 0) {
      const enrollment = await Enrollment.findOneAndUpdate(
        { userId, courseId },
        {
          amount: 0,
          currency: "INR",
          paymentMethod: "free",
          isPaid: true,
          purchasedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      return res.json({ free: true, enrollment });
    }

    const shortId = `${userId.slice(-6)}${String(courseId).slice(-6)}`;
    const orderInfo = await createRazorpayOrder({
      amountInINR: coursePrice,
      currency: "INR",
      receiptPrefix: `crs_${shortId}`,
      notes: { courseId: String(courseId), userId, type: "course_enrollment" },
    });

    // Save pending enrollment strictly bound to this orderId
    await Enrollment.findOneAndUpdate(
      { userId, courseId },
      {
        orderId: orderInfo.orderId,
        amount: coursePrice,
        currency: orderInfo.currency,
        paymentMethod: "razorpay",
        isPaid: false,
      },
      { upsert: true, new: true }
    );

    res.json({
      ...orderInfo,
      courseName: course.title,
    });
  } catch (e) {
    console.error("[createOrder ERROR]", e.message, e.statusCode || 500);
    res.status(e.statusCode || 500).json({ error: e.message || "Failed to create Razorpay order" });
  }
};

/* ── POST /payment/verify ────────────────────────────────────────── */
exports.verifyPayment = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
    } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Valid courseId is required." });
    }

    const valid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!valid) {
      return res.status(400).json({ error: "Payment verification failed - invalid signature." });
    }

    // Bind strictly to BOTH courseId AND the exact Razorpay orderId created for this course
    const enrollment = await Enrollment.findOneAndUpdate(
      { userId, courseId, orderId: razorpay_order_id },
      {
        isPaid: true,
        paymentId: razorpay_payment_id,
        purchasedAt: new Date(),
      },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({ error: "Matching pending order enrollment not found." });
    }

    res.json({ message: "Payment verified. Enrollment confirmed.", enrollment });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ── GET /payment/enrollment/check/:courseId ─────────────────────── */
exports.checkEnrollment = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }
    const enrollment = await Enrollment.findOne({ userId, courseId });
    res.json({ enrolled: Boolean(enrollment && enrollment.isPaid), enrollment });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ── GET /payment/enrollment/my ──────────────────────────────────── */
exports.myEnrollments = async (req, res) => {
  try {
    const userId = String(req.user.id);
    if (!userId) {
      return res.status(401).json({ error: "Valid user session required." });
    }

    const rawEnrollments = await Enrollment.find({ userId, isPaid: true })
      .sort({ purchasedAt: -1, updatedAt: -1 })
      .populate("courseId")
      .lean();

    // Filter out orphaned records if a course document was deleted
    const validEnrollments = rawEnrollments.filter((e) => e && e.courseId && e.courseId._id);
    const courseIds = validEnrollments.map((e) => e.courseId._id);

    const weekDocs = courseIds.length
      ? await Week.find({ courseId: { $in: courseIds }, isBonus: { $ne: true } })
          .select("courseId weekNumber")
          .sort({ weekNumber: 1 })
          .lean()
      : [];

    const weeksByCourse = new Map();
    for (const w of weekDocs) {
      const key = String(w.courseId);
      if (!weeksByCourse.has(key)) weeksByCourse.set(key, []);
      weeksByCourse.get(key).push(w.weekNumber);
    }

    const enrollments = validEnrollments.map((e) => ({
      ...e,
      regularWeeksAvailable: weeksByCourse.get(String(e.courseId._id)) || [],
    }));

    res.json({ enrollments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ── POST /payment/enrollment/complete-week ──────────────────────── */
exports.completeWeek = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { courseId, weekNumber } = req.body;
    const weekNum = Number(weekNumber);

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId) || !Number.isFinite(weekNum)) {
      return res.status(400).json({ error: "Valid courseId and weekNumber required." });
    }

    const enrollment = await Enrollment.findOne({ userId, courseId, isPaid: true });
    if (!enrollment) return res.status(403).json({ error: "Not enrolled in this course." });

    if (enrollment.completedWeeks.includes(weekNum)) {
      return res.json({ message: "Already completed", enrollment });
    }

    const week = await Week.findOne({ courseId, weekNumber: weekNum });
    if (!week) return res.status(404).json({ error: "Week module not found." });

    enrollment.completedWeeks.push(weekNum);
    enrollment.totalXP     += week.bonusXP || 0;
    enrollment.totalPoints += week.bonusPoints || 0;

    // Unlock bonus only after completing all regular (non-bonus) weeks
    const course = await Course.findById(courseId);
    const regularWeeks = await Week.find({ courseId, isBonus: { $ne: true } }).select("weekNumber");
    const regularWeekNums = regularWeeks.map((w) => w.weekNumber);
    const completedRegularCount = regularWeekNums.filter((n) => enrollment.completedWeeks.includes(n)).length;
    const requiredRegular = Math.max(regularWeekNums.length, course?.totalWeeks || 1);

    if (completedRegularCount >= requiredRegular) {
      enrollment.bonusUnlocked = true;
    }

    await enrollment.save();
    res.json({
      message: "Week completed!",
      xpEarned:      week.bonusXP || 0,
      pointsEarned:  week.bonusPoints || 0,
      bonusUnlocked: enrollment.bonusUnlocked,
      enrollment,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ── GET /payment/enrollment/stats (Admin protected) ─────────────── */
exports.enrollmentStats = async (req, res) => {
  try {
    const total = await Enrollment.countDocuments({ isPaid: true });
    const revenue = await Enrollment.aggregate([
      { $match: { isPaid: true } },
      { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $gt: ["$amount", 0] },
                "$amount",
                { $ifNull: ["$course.price", 0] }
              ]
            }
          }
        }
      },
    ]);
    res.json({
      totalEnrollments: total,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
