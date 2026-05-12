const { body } = require('express-validator');
const { query } = require('../config/db');

const createAssignmentValidation = [
  body('title').trim().notEmpty().withMessage('Assignment title is required.'),
  body('deadline').notEmpty().withMessage('Deadline is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.')
];

function resolveCourseId(input) {
  if (input.courseId) return Number(input.courseId);

  if (input.courseCode) {
    const rows = query('SELECT id FROM courses WHERE code = ? LIMIT 1', [input.courseCode]);
    if (rows.length) return rows[0].id;
  }

  if (input.course) {
    const rows = query('SELECT id FROM courses WHERE title = ? LIMIT 1', [input.course]);
    if (rows.length) return rows[0].id;
  }

  return null;
}

function listAssignments(req, res, next) {
  try {
    let rows;
    if (req.user.role === 'Student') {
      rows = query(
        `SELECT a.id, a.title, c.title AS course, c.code AS courseCode, a.deadline, a.description
         FROM assignments a
         JOIN courses c ON c.id = a.course_id
         JOIN course_enrollments ce ON ce.course_id = c.id
         WHERE ce.student_id = ?
         ORDER BY a.deadline ASC`,
        [req.user.id]
      );
    } else {
      rows = query(
        `SELECT a.id, a.title, c.title AS course, c.code AS courseCode, a.deadline, a.description
         FROM assignments a
         JOIN courses c ON c.id = a.course_id
         ORDER BY a.created_at DESC`
      );
    }
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

function createAssignment(req, res, next) {
  try {
    const courseId = resolveCourseId(req.body);
    if (!courseId) {
      return res.status(400).json({ message: 'Valid course is required (courseId, courseCode, or course title).' });
    }

    const { title, deadline, description } = req.body;

    const result = query(
      `INSERT INTO assignments (title, course_id, deadline, description, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [title, courseId, deadline, description, req.user.id]
    );

    const insertId = result[0].insertId;
    const assignment = query(
      `SELECT a.id, a.title, c.title AS course, c.code AS courseCode, a.deadline, a.description
       FROM assignments a
       JOIN courses c ON c.id = a.course_id
       WHERE a.id = ? LIMIT 1`,
      [insertId]
    )[0];

    return res.status(201).json(assignment);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createAssignmentValidation,
  listAssignments,
  createAssignment
};
