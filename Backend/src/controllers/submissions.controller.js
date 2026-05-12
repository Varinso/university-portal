const { body, param } = require('express-validator');
const { query } = require('../config/db');

const createSubmissionValidation = [
  body('assignmentId').isInt({ min: 1 }).withMessage('assignmentId is required.'),
  body('comment').optional().isString().withMessage('Comment must be text.')
];

const updateSubmissionValidation = [
  param('id').isInt({ min: 1 }).withMessage('Submission id is invalid.'),
  body('status').optional().isIn(['Submitted', 'Not Submitted', 'Pending Review', 'Checked']).withMessage('Invalid status.'),
  body('feedback').optional().isString().withMessage('Feedback must be text.'),
  body('gpa').optional().isFloat({ min: 0, max: 4 }).withMessage('GPA must be between 0 and 4.')
];

function listSubmissions(req, res, next) {
  try {
    if (req.user.role === 'Student') {
      const rows = query(
        `SELECT
           s.id,
           a.title AS assignment,
           c.code AS courseCode,
           s.status,
           s.feedback,
           s.gpa,
           s.comment,
           s.submitted_at AS submittedAt
         FROM submissions s
         JOIN assignments a ON a.id = s.assignment_id
         JOIN courses c ON c.id = a.course_id
         WHERE s.student_id = ?
         ORDER BY a.deadline ASC`,
        [req.user.id]
      );
      return res.json(rows);
    }

    const rows = query(
      `SELECT
         s.id,
         u.name AS studentName,
         a.title AS assignment,
         c.code AS courseCode,
         s.status,
         s.feedback,
         s.gpa,
         s.comment,
         s.submitted_at AS submittedAt
       FROM submissions s
       JOIN users u ON u.id = s.student_id
       JOIN assignments a ON a.id = s.assignment_id
       JOIN courses c ON c.id = a.course_id
       ORDER BY s.submitted_at DESC`
    );

    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

function createSubmission(req, res, next) {
  try {
    const studentId = req.user.id;
    const { assignmentId, comment } = req.body;

    const assignment = query('SELECT id FROM assignments WHERE id = ? LIMIT 1', [assignmentId]);
    if (!assignment.length) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const existing = query(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1',
      [assignmentId, studentId]
    );

    if (existing.length) {
      query(
        `UPDATE submissions
         SET status = 'Submitted', comment = ?, submitted_at = datetime('now')
         WHERE id = ?`,
        [comment || '', existing[0].id]
      );

      const rowResults = query('SELECT * FROM submissions WHERE id = ? LIMIT 1', [existing[0].id]);
      const row = rowResults[0];
      return res.json(row);
    }

    const result = query(
      `INSERT INTO submissions (assignment_id, student_id, status, comment, feedback, gpa, submitted_at)
       VALUES (?, ?, 'Submitted', ?, 'Pending review', 0, datetime('now'))`,
      [assignmentId, studentId, comment || '']
    );

    const rowResults = query('SELECT * FROM submissions WHERE id = ? LIMIT 1', [result[0].insertId]);
    const row = rowResults[0];
    return res.status(201).json(row);
  } catch (error) {
    return next(error);
  }
}

function updateSubmission(req, res, next) {
  try {
    const submissionId = Number(req.params.id);
    const { status, feedback, gpa } = req.body;

    const existing = query('SELECT * FROM submissions WHERE id = ? LIMIT 1', [submissionId]);
    if (!existing.length) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    query(
      `UPDATE submissions
       SET status = COALESCE(?, status),
           feedback = COALESCE(?, feedback),
           gpa = COALESCE(?, gpa),
           graded_at = datetime('now'),
           graded_by = ?
       WHERE id = ?`,
      [status || null, feedback || null, gpa ?? null, req.user.id, submissionId]
    );

    const updatedResults = query('SELECT * FROM submissions WHERE id = ? LIMIT 1', [submissionId]);
    const updated = updatedResults[0];

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createSubmissionValidation,
  updateSubmissionValidation,
  listSubmissions,
  createSubmission,
  updateSubmission
};
