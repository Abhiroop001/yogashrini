const express = require("express");
const router  = express.Router();
const c       = require("../controller/course_controller");
const { authenticate, optionalAuth, requireAdmin } = require("../middleware/auth");

// Courses (public read uses optionalAuth so admin can view drafts; mutations restricted to admin)
router.get("/",          optionalAuth, c.listCourses);
router.get("/:id",       optionalAuth, c.getCourse);
router.post("/",         authenticate, requireAdmin, c.createCourse);
router.put("/:id",       authenticate, requireAdmin, c.updateCourse);
router.delete("/:id",    authenticate, requireAdmin, c.deleteCourse);

// Weeks
router.get("/:id/weeks",                 optionalAuth, c.listWeeks);
router.post("/:id/week",                 authenticate, requireAdmin, c.addWeek);
router.put("/:courseId/week/:weekId",    authenticate, requireAdmin, c.updateWeek);
router.delete("/:courseId/week/:weekId", authenticate, requireAdmin, c.deleteWeek);

module.exports = router;
