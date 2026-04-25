const { body } = require('express-validator');
const { query } = require('../config/db');

const createAnnouncementValidation = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('message').trim().notEmpty().withMessage('Message is required.'),
  body('audience').optional().isString().withMessage('Audience must be text.')
];

async function listAnnouncements(_req, res, next) {
  try {
    const rows = await query(
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

async function createAnnouncement(req, res, next) {
  try {
    const { title, message, audience } = req.body;
    const result = await query(
      `INSERT INTO announcements (title, message, audience, created_by)
       VALUES (?, ?, ?, ?)`,
      [title, message, audience || 'All Students', req.user.id]
    );

    const [row] = await query('SELECT * FROM announcements WHERE id = ? LIMIT 1', [result.insertId]);
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
