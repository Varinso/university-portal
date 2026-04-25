const { param } = require('express-validator');
const { query } = require('../config/db');

const reportValidation = [
  param('studentId').isInt({ min: 1 }).withMessage('studentId must be a valid number.')
];

async function getStudentReport(req, res, next) {
  try {
    const studentId = Number(req.params.studentId);

    const [student] = await query(
      `SELECT u.id, u.name, u.user_code AS studentCode, COALESCE(sp.department, 'General') AS department
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = ? AND u.role = 'Student' LIMIT 1`,
      [studentId]
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const [gpaStats] = await query(
      `SELECT
         ROUND(AVG(NULLIF(ce.gpa, 0)), 2) AS averageGpa,
         ROUND(SUM(c.credit), 2) AS totalCredits
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       WHERE ce.student_id = ?`,
      [studentId]
    );

    const [attendance] = await query(
      `SELECT
         SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
         COUNT(*) AS total
       FROM attendance_records
       WHERE student_id = ?`,
      [studentId]
    );

    const [submission] = await query(
      `SELECT
         SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) AS submitted,
         COUNT(*) AS total
       FROM submissions
       WHERE student_id = ?`,
      [studentId]
    );

    const assignmentRows = await query(
      `SELECT
         a.title AS assignment,
         c.code AS courseCode,
         c.title AS courseTitle,
         c.credit,
         s.status,
         s.gpa
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN courses c ON c.id = a.course_id
       WHERE s.student_id = ?
       ORDER BY a.deadline ASC`,
      [studentId]
    );

    const attendanceRate = attendance.total
      ? Math.round((Number(attendance.present || 0) / Number(attendance.total || 0)) * 100)
      : 0;

    const submissionRate = submission.total
      ? Math.round((Number(submission.submitted || 0) / Number(submission.total || 0)) * 100)
      : 0;

    return res.json({
      student,
      summary: {
        averageGpa: Number(gpaStats.averageGpa || 0).toFixed(2),
        totalCredits: Number(gpaStats.totalCredits || 0),
        attendanceRate: `${attendanceRate}%`,
        submissionRate: `${submissionRate}%`,
        submittedAssignments: Number(submission.submitted || 0),
        totalAssignments: Number(submission.total || 0)
      },
      rows: assignmentRows
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  reportValidation,
  getStudentReport
};
