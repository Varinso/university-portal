const express = require('express');

const authRoutes = require('./auth.routes');
const studentRoutes = require('./students.routes');
const instructorRoutes = require('./instructors.routes');
const courseRoutes = require('./courses.routes');
const assignmentRoutes = require('./assignments.routes');
const submissionRoutes = require('./submissions.routes');
const attendanceRoutes = require('./attendance.routes');
const announcementRoutes = require('./announcements.routes');
const forumRoutes = require('./forum.routes');
const reportRoutes = require('./reports.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/instructors', instructorRoutes);
router.use('/courses', courseRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/announcements', announcementRoutes);
router.use('/forum', forumRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
