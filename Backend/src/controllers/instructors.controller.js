const { query } = require('../config/db');

function getInstructorDashboard(req, res, next) {
  try {
    const instructorId = req.user.id;

    const studentsResults = query(
      `SELECT COUNT(*) AS totalStudents
       FROM users
       WHERE role = 'Student'`
    );
    const students = studentsResults[0];

    const coursesResults = query(
      `SELECT COUNT(*) AS myCourses
       FROM courses
       WHERE instructor_id = ?`,
      [instructorId]
    );
    const courses = coursesResults[0];

    const pendingResults = query(
      `SELECT COUNT(*) AS pendingSubmissions
       FROM submissions
       WHERE status IN ('Submitted', 'Pending Review')`
    );
    const pending = pendingResults[0];

    const announcementsResults = query(
      `SELECT COUNT(*) AS announcements
       FROM announcements
       WHERE created_by = ?`,
      [instructorId]
    );
    const announcements = announcementsResults[0];

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
