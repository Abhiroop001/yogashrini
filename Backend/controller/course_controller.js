const Course = require("../db/coursedb");
const Week   = require("../db/weekdb");
const mongoose = require("mongoose");
const path   = require("path");
const fs     = require("fs");

// Ensure upload directories exist
const thumbDir = path.join(__dirname, "../public/thumbnails");
const videoDir = path.join(__dirname, "../public/videos");
if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

/* ─── COURSES ───────────────────────────────────────────────────── */

// GET /course — list all (published for frontend, all for admin)
exports.listCourses = async (req, res) => {
  try {
    const filter = req.query.all === "true" ? {} : { isPublished: true };
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
    res.json({ course });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /course — admin creates course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, price, totalWeeks, level, instructor, isPublished } = req.body;

    let thumbnailFilename = "";
    if (req.files && req.files.thumbnail) {
      const thumb = req.files.thumbnail;
      thumbnailFilename = Date.now() + "_" + thumb.name.replace(/\s/g, "_");
      await thumb.mv(path.join(thumbDir, thumbnailFilename));
    }

    const course = new Course({
      title, description,
      price: Number(price) || 0,
      totalWeeks: Number(totalWeeks) || 1,
      level, instructor,
      isPublished: isPublished === "true" || isPublished === true,
      thumbnail: thumbnailFilename,
    });

    await course.save();
    res.json({ message: "Course created", course });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// PUT /course/:id — admin updates course
exports.updateCourse = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.price)      updates.price      = Number(updates.price);
    if (updates.totalWeeks) updates.totalWeeks = Number(updates.totalWeeks);
    if (updates.isPublished !== undefined)
      updates.isPublished = updates.isPublished === "true" || updates.isPublished === true;

    if (req.files && req.files.thumbnail) {
      const thumb = req.files.thumbnail;
      const thumbnailFilename = Date.now() + "_" + thumb.name.replace(/\s/g, "_");
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
    await Course.findByIdAndDelete(req.params.id);
    await Week.deleteMany({ courseId: req.params.id });
    res.json({ message: "Course deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ─── WEEKS ─────────────────────────────────────────────────────── */

// GET /course/:id/weeks
exports.listWeeks = async (req, res) => {
  try {
    const weeks = await Week.find({ courseId: req.params.id }).sort({ weekNumber: 1 });
    res.json({ weeks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /course/:id/week — admin adds a week
exports.addWeek = async (req, res) => {
  try {
    const { weekNumber, title, description, bonusXP, bonusPoints, isBonus } = req.body;
    const videos = [];

    if (req.files) {
      // Support multiple files: video0, video1, video2, ...
      const fileKeys = Object.keys(req.files).filter(k => k.startsWith("video"));
      let idx = 0;
      for (const key of fileKeys) {
        const vid = req.files[key];
        const filename = Date.now() + "_" + idx + "_" + vid.name.replace(/\s/g, "_");
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
    res.json({ message: "Week added", week });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// PUT /course/:courseId/week/:weekId — update week metadata (no new video upload here)
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
