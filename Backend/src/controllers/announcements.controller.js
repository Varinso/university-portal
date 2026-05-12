const { body } = require('express-validator');
const { query } = require('../config/db');

const createAnnouncementValidation = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('message').trim().notEmpty().withMessage('Message is required.'),
  body('audience').optional().isString().withMessage('Audience must be text.')
];

function listAnnouncements(_req, res, next) {
  try {
    const rows = query(
      `SELECT
         a.id,
         a.title,
         a.message,
         a.audience,
         a.created_at AS date,
         u.role AS authorRole,
         u.name AS authorName
       FROM announcements a
       JOIN users u ON u.id = a.created_by
       ORDER BY a.created_at DESC`
    );

    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

function createAnnouncement(req, res, next) {
  try {
    const { title, message, audience } = req.body;
    const result = query(
      `INSERT INTO announcements (title, message, audience, created_by)
       VALUES (?, ?, ?, ?)`,
      [title, message, audience || 'All Students', req.user.id]
    );

    const rowResults = query('SELECT * FROM announcements WHERE id = ? LIMIT 1', [result[0].insertId]);
    const row = rowResults[0];
    return res.status(201).json(row);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createAnnouncementValidation,
  listAnnouncements,
  createAnnouncement
};
