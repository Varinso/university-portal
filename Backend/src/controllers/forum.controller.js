const { body } = require('express-validator');
const { query } = require('../config/db');

const createForumPostValidation = [
  body('topic').trim().notEmpty().withMessage('Topic is required.'),
  body('message').trim().notEmpty().withMessage('Message is required.')
];

async function listForumPosts(_req, res, next) {
  try {
    const rows = await query(
      `SELECT
         f.id,
         f.topic,
         f.message,
         f.created_at AS date,
         u.name AS author,
         u.role
       FROM forum_posts f
       JOIN users u ON u.id = f.author_id
       ORDER BY f.created_at DESC`
    );

    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

async function createForumPost(req, res, next) {
  try {
    const { topic, message } = req.body;
    const result = await query(
      `INSERT INTO forum_posts (topic, message, author_id)
       VALUES (?, ?, ?)`,
      [topic, message, req.user.id]
    );

    const [row] = await query(
      `SELECT
         f.id,
         f.topic,
         f.message,
         f.created_at AS date,
         u.name AS author,
         u.role
       FROM forum_posts f
       JOIN users u ON u.id = f.author_id
       WHERE f.id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json(row);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createForumPostValidation,
  listForumPosts,
  createForumPost
};
