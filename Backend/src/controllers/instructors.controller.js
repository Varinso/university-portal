const { query } = require('../config/db');

async function getInstructorDashboard(req, res, next) {
  try {
    const instructorId = req.user.id;

    const [students] = await query(
      `SELECT COUNT(*) AS totalStudents
       FROM users
       WHERE role = 'Student'`
    );

    const [courses] = await query(
      `SELECT COUNT(*) AS myCourses
       FROM courses
       WHERE instructor_id = ?`,
      [instructorId]
    );

    const [pending] = await query(
      `SELECT COUNT(*) AS pendingSubmissions
       FROM submissions
       WHERE status IN ('Submitted', 'Pending Review')`
    );

    const [announcements] = await query(
      `SELECT COUNT(*) AS announcements
       FROM announcements
       WHERE created_by = ?`,
      [instructorId]
    );

    return res.json({
      totalStudents: Number(students.totalStudents || 0),
      myCourses: Number(courses.myCourses || 0),
      pendingSubmissions: Number(pending.pendingSubmissions || 0),
      announcements: Number(announcements.announcements || 0)
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getInstructorDashboard };
