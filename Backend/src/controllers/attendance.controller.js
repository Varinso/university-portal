const { body } = require('express-validator');
const { query } = require('../config/db');

const saveAttendanceValidation = [
  body('courseId').isInt({ min: 1 }).withMessage('courseId is required.'),
  body('date').isISO8601().withMessage('date must be in ISO format.'),
  body('records').isArray({ min: 1 }).withMessage('records must be a non-empty array.'),
  body('records.*.studentId').isInt({ min: 1 }).withMessage('records.studentId is required.'),
  body('records.*.status').isIn(['Present', 'Absent']).withMessage('records.status must be Present or Absent.')
];

async function getMyAttendance(req, res, next) {
  try {
    const studentId = req.user.id;

    const rows = await query(
      `SELECT
         c.code AS courseCode,
         c.title AS courseTitle,
         COUNT(ar.id) AS totalClasses,
         SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) AS presentClasses
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       LEFT JOIN attendance_records ar ON ar.course_id = c.id AND ar.student_id = ce.student_id
       WHERE ce.student_id = ?
       GROUP BY c.id, c.code, c.title
       ORDER BY c.code`,
      [studentId]
    );

    const mapped = rows.map((row) => {
      const total = Number(row.totalClasses || 0);
      const present = Number(row.presentClasses || 0);
      const percent = total ? Math.round((present / total) * 100) : 0;
      return {
        courseCode: row.courseCode,
        courseTitle: row.courseTitle,
        totalClasses: total,
        presentClasses: present,
        percentage: `${percent}%`
      };
    });

    const totalClasses = mapped.reduce((sum, row) => sum + row.totalClasses, 0);
    const totalPresent = mapped.reduce((sum, row) => sum + row.presentClasses, 0);
    const totalAbsent = totalClasses - totalPresent;
    const attendanceRate = totalClasses ? Math.round((totalPresent / totalClasses) * 100) : 0;

    return res.json({
      stats: {
        present: totalPresent,
        absent: totalAbsent,
        rate: `${attendanceRate}%`
      },
      courses: mapped
    });
  } catch (error) {
    return next(error);
  }
}

async function listAttendanceForInstructor(_req, res, next) {
  try {
    const rows = await query(
      `SELECT
         u.id AS studentId,
         u.name,
         u.user_code AS studentCode,
         SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) AS presentCount,
         SUM(CASE WHEN ar.status = 'Absent' THEN 1 ELSE 0 END) AS absentCount
       FROM users u
       LEFT JOIN attendance_records ar ON ar.student_id = u.id
       WHERE u.role = 'Student'
       GROUP BY u.id, u.name, u.user_code
       ORDER BY u.name`
    );

    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

async function saveAttendance(req, res, next) {
  try {
    const { courseId, date, records } = req.body;

    for (const item of records) {
      await query(
        `INSERT INTO attendance_records (course_id, student_id, attendance_date, status, marked_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)`,
        [courseId, item.studentId, date, item.status, req.user.id]
      );
    }

    return res.json({ message: 'Attendance saved successfully.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  saveAttendanceValidation,
  getMyAttendance,
  listAttendanceForInstructor,
  saveAttendance
};
