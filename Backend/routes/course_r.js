const express = require("express");
const router  = express.Router();
const c       = require("../controller/course_controller");

// Courses
router.get("/",          c.listCourses);
router.get("/:id",       c.getCourse);
router.post("/",         c.createCourse);
router.put("/:id",       c.updateCourse);
router.delete("/:id",    c.deleteCourse);

// Weeks
router.get("/:id/weeks",                 c.listWeeks);
router.post("/:id/week",                 c.addWeek);
router.put("/:courseId/week/:weekId",    c.updateWeek);
router.delete("/:courseId/week/:weekId", c.deleteWeek);

module.exports = router;
