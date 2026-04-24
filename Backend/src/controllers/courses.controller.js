const { body } = require('express-validator');
const { query } = require('../config/db');

const createCourseValidation = [
  body('code').trim().notEmpty().withMessage('Course code is required.'),
  body('title').trim().notEmpty().withMessage('Course title is required.'),
  body('section').trim().notEmpty().withMessage('Section is required.'),
  body('credit').optional().isFloat({ min: 0.5 }).withMessage('Credit must be a number.')
];

async function listCourses(req, res, next) {
  try {
    if (req.user.role === 'Student') {
      const rows = await query(
        `SELECT c.id, c.code, c.title, c.section, c.credit, u.name AS instructor, COALESCE(ce.gpa, 0) AS gpa
         FROM course_enrollments ce
         JOIN courses c ON c.id = ce.course_id
         LEFT JOIN users u ON u.id = c.instructor_id
         WHERE ce.student_id = ?
         ORDER BY c.code`,
        [req.user.id]
      );
      return res.json(rows);
    }

    const rows = await query(
      `SELECT c.id, c.code, c.title, c.section, c.credit, u.name AS instructor
       FROM courses c
       LEFT JOIN users u ON u.id = c.instructor_id
       ORDER BY c.code`
    );

    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

async function createCourse(req, res, next) {
  try {
    const { code, title, section, credit } = req.body;

    const existing = await query('SELECT id FROM courses WHERE code = ? AND section = ? LIMIT 1', [code, section]);
    if (existing.length) {
      return res.status(409).json({ message: 'Course with this code and section already exists.' });
    }

    const result = await query(
      `INSERT INTO courses (code, title, section, instructor_id, credit)
       VALUES (?, ?, ?, ?, ?)`,
      [code, title, section, req.user.id, Number(credit || 3)]
    );

    const [course] = await query('SELECT * FROM courses WHERE id = ? LIMIT 1', [result.insertId]);
    return res.status(201).json(course);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createCourseValidation,
  listCourses,
  createCourse
};
