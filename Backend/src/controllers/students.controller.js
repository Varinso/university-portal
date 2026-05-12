const { query } = require('../config/db');

function getMyDashboard(req, res, next) {
  try {
    const studentId = req.user.id;

    const courseStatsResults = query(
      `SELECT
         COUNT(ce.course_id) AS enrolledCourses,
         ROUND(AVG(NULLIF(ce.gpa, 0)), 2) AS currentGpa
       FROM course_enrollments ce
       WHERE ce.student_id = ?`,
      [studentId]
    );
    const courseStats = courseStatsResults[0];

    const submissionStatsResults = query(
      `SELECT
         SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) AS submitted,
         COUNT(*) AS total
       FROM submissions
       WHERE student_id = ?`,
      [studentId]
    );
    const submissionStats = submissionStatsResults[0];

    const attendanceStatsResults = query(
      `SELECT
         SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
         SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
         COUNT(*) AS total
       FROM attendance_records
       WHERE student_id = ?`,
      [studentId]
    );
    const attendanceStats = attendanceStatsResults[0];

    const attendanceRate = attendanceStats.total
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
      : 0;

    return res.json({
      enrolledCourses: Number(courseStats.enrolledCourses || 0),
      currentGpa: Number(courseStats.currentGpa || 0).toFixed(2),
      overallCgpa: Number(courseStats.currentGpa || 0).toFixed(2),
      submission: {
        submitted: Number(submissionStats.submitted || 0),
        total: Number(submissionStats.total || 0)
      },
      attendance: {
        present: Number(attendanceStats.present || 0),
        absent: Number(attendanceStats.absent || 0),
        rate: `${attendanceRate}%`
      }
    });
  } catch (error) {
    return next(error);
  }
}

function getMyCourses(req, res, next) {
  try {
    const studentId = req.user.id;

    const rows = query(
      `SELECT
         c.id,
         c.code,
         c.title,
         c.section,
         c.credit,
         u.name AS instructor,
         COALESCE(ce.gpa, 0) AS gpa
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       LEFT JOIN users u ON u.id = c.instructor_id
       WHERE ce.student_id = ?
       ORDER BY c.code`,
      [studentId]
    );

    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

function listStudents(req, res, next) {
  try {
    const rows = query(
      `SELECT
         u.id,
         u.name,
         u.user_code AS studentId,
         u.email,
         COALESCE(sp.department, 'General') AS department
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.role = 'Student'
       ORDER BY u.name`
    );

    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMyDashboard,
  getMyCourses,
  listStudents
};
