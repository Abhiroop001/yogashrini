// Server/controller/course_controller.js
const Course = require("../db/coursedb");
const Week   = require("../db/weekdb");
const Enrollment = require("../db/enrollmentdb");
const mongoose = require("mongoose");
const path   = require("path");
const fs     = require("fs");

// Ensure upload directories exist
const thumbDir = path.join(__dirname, "../public/thumbnails");
const videoDir = path.join(__dirname, "../public/videos");
if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

/* ─── COURSES ───────────────────────────────────────────────────── */

// GET /course — list published for public, all only for authenticated admins
exports.listCourses = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === "admin";
    const filter = req.query.all === "true" && isAdmin ? {} : { isPublished: true };
    const courses = await Course.find(filter).sort({ createdAt: -1 });
    res.json({ courses });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /course/:id
exports.getCourse = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid course ID format" });
    }
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!course.isPublished && (!req.user || req.user.role !== "admin")) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json({ course });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /course — admin creates course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, price, totalWeeks, level, instructor, isPublished } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Course title is required" });
    }

    let thumbnailFilename = "";
    if (req.files && req.files.thumbnail) {
      const thumb = req.files.thumbnail;
      const safeName = path.basename(thumb.name).replace(/[^a-zA-Z0-9._-]/g, "_");
      thumbnailFilename = Date.now() + "_" + safeName;
      await thumb.mv(path.join(thumbDir, thumbnailFilename));
    }

    const course = new Course({
      title: String(title).trim(),
      description: description || "",
      price: Math.max(0, Number(price) || 0),
      totalWeeks: Math.max(1, Number(totalWeeks) || 1),
      level: level || "Beginner",
      instructor: instructor || "Yogashrini Faculty",
      isPublished: isPublished === "true" || isPublished === true,
      thumbnail: thumbnailFilename,
    });

    await course.save();
    res.status(201).json({ message: "Course created", course });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// PUT /course/:id — admin updates course
exports.updateCourse = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid course ID format" });
    }

    const updates = { ...req.body };
    if (updates.price !== undefined)      updates.price      = Math.max(0, Number(updates.price) || 0);
    if (updates.totalWeeks !== undefined) updates.totalWeeks = Math.max(1, Number(updates.totalWeeks) || 1);
    if (updates.isPublished !== undefined)
      updates.isPublished = updates.isPublished === "true" || updates.isPublished === true;

    if (req.files && req.files.thumbnail) {
      const thumb = req.files.thumbnail;
      const safeName = path.basename(thumb.name).replace(/[^a-zA-Z0-9._-]/g, "_");
      const thumbnailFilename = Date.now() + "_" + safeName;
      await thumb.mv(path.join(thumbDir, thumbnailFilename));
      updates.thumbnail = thumbnailFilename;
    }

    const course = await Course.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Course updated", course });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// DELETE /course/:id
exports.deleteCourse = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid course ID format" });
    }
    await Course.findByIdAndDelete(req.params.id);
    await Week.deleteMany({ courseId: req.params.id });
    res.json({ message: "Course deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ─── WEEKS ─────────────────────────────────────────────────────── */

// GET /course/:id/weeks — returns syllabus; strips video filenames unless enrolled or admin or free
exports.listWeeks = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid course ID format" });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    let canWatchVideos = false;
    if (req.user && req.user.role === "admin") {
      canWatchVideos = true;
    } else if (Number(course.price) === 0 && req.user) {
      // Free course still requires signed-in student or explicit check
      const enrollment = await Enrollment.findOne({ userId: String(req.user.id), courseId: course._id, isPaid: true });
      canWatchVideos = Boolean(enrollment) || true;
    } else if (req.user) {
      const enrollment = await Enrollment.findOne({ userId: String(req.user.id), courseId: course._id, isPaid: true });
      canWatchVideos = Boolean(enrollment);
    }

    const rawWeeks = await Week.find({ courseId: req.params.id }).sort({ weekNumber: 1 });
    const weeks = rawWeeks.map((w) => {
      const obj = w.toObject();
      obj.videos = (obj.videos || []).map((v) => ({
        _id: v._id,
        title: v.title,
        description: v.description,
        duration: v.duration,
        order: v.order,
        locked: !canWatchVideos,
        ...(canWatchVideos ? { filename: v.filename } : {}),
      }));
      return obj;
    });

    res.json({ weeks, authorized: canWatchVideos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /course/:id/week — admin adds a week
exports.addWeek = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid course ID format" });
    }
    const { weekNumber, title, description, bonusXP, bonusPoints, isBonus } = req.body;
    const videos = [];

    if (req.files) {
      const fileKeys = Object.keys(req.files).filter(k => k.startsWith("video"));
      let idx = 0;
      for (const key of fileKeys) {
        const vid = req.files[key];
        const safeName = path.basename(vid.name).replace(/[^a-zA-Z0-9._-]/g, "_");
        const filename = Date.now() + "_" + idx + "_" + safeName;
        await vid.mv(path.join(videoDir, filename));
        const meta = JSON.parse(req.body[`videoMeta_${idx}`] || "{}");
        videos.push({
          title:       meta.title       || vid.name,
          description: meta.description || "",
          filename,
          duration:    meta.duration    || "",
          order:       idx,
        });
        idx++;
      }
    }

    const week = new Week({
      courseId: req.params.id,
      weekNumber: Number(weekNumber),
      title, description,
      videos,
      bonusXP:     Number(bonusXP)     || 50,
      bonusPoints: Number(bonusPoints) || 10,
      isBonus:     isBonus === "true"  || isBonus === true,
    });

    await week.save();
    res.status(201).json({ message: "Week added", week });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// PUT /course/:courseId/week/:weekId — admin updates week metadata
exports.updateWeek = async (req, res) => {
  try {
    const { title, description, bonusXP, bonusPoints, isBonus } = req.body;
    const updates = { title, description };
    if (bonusXP     !== undefined) updates.bonusXP     = Number(bonusXP);
    if (bonusPoints !== undefined) updates.bonusPoints = Number(bonusPoints);
    if (isBonus     !== undefined) updates.isBonus     = isBonus === "true" || isBonus === true;

    const week = await Week.findByIdAndUpdate(req.params.weekId, updates, { new: true });
    if (!week) return res.status(404).json({ error: "Week not found" });
    res.json({ message: "Week updated", week });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// DELETE /course/:courseId/week/:weekId
exports.deleteWeek = async (req, res) => {
  try {
    await Week.findByIdAndDelete(req.params.weekId);
    res.json({ message: "Week deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
