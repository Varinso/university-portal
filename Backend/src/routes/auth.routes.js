const express = require('express');

const { validate } = require('../utils/validators');
const {
  registerValidation,
  loginValidation,
  register,
  login
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

module.exports = router;
