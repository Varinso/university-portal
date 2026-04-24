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

async function listSubmissions(req, res, next) {
  try {
    if (req.user.role === 'Student') {
      const rows = await query(
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

    const rows = await query(
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

async function createSubmission(req, res, next) {
  try {
    const studentId = req.user.id;
    const { assignmentId, comment } = req.body;

    const assignment = await query('SELECT id FROM assignments WHERE id = ? LIMIT 1', [assignmentId]);
    if (!assignment.length) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const existing = await query(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1',
      [assignmentId, studentId]
    );

    if (existing.length) {
      await query(
        `UPDATE submissions
         SET status = 'Submitted', comment = ?, submitted_at = NOW()
         WHERE id = ?`,
        [comment || '', existing[0].id]
      );

      const [row] = await query('SELECT * FROM submissions WHERE id = ? LIMIT 1', [existing[0].id]);
      return res.json(row);
    }

    const result = await query(
      `INSERT INTO submissions (assignment_id, student_id, status, comment, feedback, gpa, submitted_at)
       VALUES (?, ?, 'Submitted', ?, 'Pending review', 0, NOW())`,
      [assignmentId, studentId, comment || '']
    );

    const [row] = await query('SELECT * FROM submissions WHERE id = ? LIMIT 1', [result.insertId]);
    return res.status(201).json(row);
  } catch (error) {
    return next(error);
  }
}

async function updateSubmission(req, res, next) {
  try {
    const submissionId = Number(req.params.id);
    const { status, feedback, gpa } = req.body;

    const existing = await query('SELECT * FROM submissions WHERE id = ? LIMIT 1', [submissionId]);
    if (!existing.length) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    await query(
      `UPDATE submissions
       SET status = COALESCE(?, status),
           feedback = COALESCE(?, feedback),
           gpa = COALESCE(?, gpa),
           graded_at = NOW(),
           graded_by = ?
       WHERE id = ?`,
      [status || null, feedback || null, gpa ?? null, req.user.id, submissionId]
    );

    const [updated] = await query('SELECT * FROM submissions WHERE id = ? LIMIT 1', [submissionId]);

    if (typeof gpa !== 'undefined') {
      await query(
        `UPDATE course_enrollments ce
         JOIN assignments a ON a.id = ?
         SET ce.gpa = ?
         WHERE ce.student_id = ? AND ce.course_id = a.course_id`,
        [updated.assignment_id, gpa, updated.student_id]
      );
    }

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
