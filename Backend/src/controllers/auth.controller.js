const bcrypt = require('bcryptjs');
const { body } = require('express-validator');

const { query } = require('../config/db');
const { signToken } = require('../utils/jwt');

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.'),
  body('id').trim().notEmpty().withMessage('Student or faculty ID is required.'),
  body('role').isIn(['Student', 'Instructor']).withMessage('Role must be Student or Instructor.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
];

const loginValidation = [
  body('identifier').trim().notEmpty().withMessage('Email or ID is required.'),
  body('password').trim().notEmpty().withMessage('Password is required.'),
  body('role').optional().isIn(['Student', 'Instructor']).withMessage('Role must be Student or Instructor.')
];

async function register(req, res, next) {
  try {
    const { name, email, id, role, password, department } = req.body;

    const existing = await query(
      'SELECT id FROM users WHERE email = ? OR user_code = ? LIMIT 1',
      [email.toLowerCase(), id]
    );

    if (existing.length) {
      return res.status(409).json({ message: 'Email or ID already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, user_code, role, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email.toLowerCase(), id, role, passwordHash]
    );

    if (role === 'Student') {
      await query(
        'INSERT INTO student_profiles (user_id, department) VALUES (?, ?)',
        [result.insertId, department || 'General']
      );
    }

    const [user] = await query(
      'SELECT id, name, email, user_code, role FROM users WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { identifier, password, role } = req.body;

    const params = [identifier.toLowerCase(), identifier.toLowerCase()];
    let sql = `SELECT id, name, email, user_code, role, password_hash
               FROM users
               WHERE (LOWER(email) = ? OR LOWER(user_code) = ?)`;

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ' LIMIT 1';

    const [user] = await query(sql, params);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_code: user.user_code,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  registerValidation,
  loginValidation,
  register,
  login
};
