const express = require('express');

const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../utils/validators');
const { reportValidation, getStudentReport } = require('../controllers/reports.controller');

const router = express.Router();

router.use(auth, authorize('Instructor'));
router.get('/student/:studentId', reportValidation, validate, getStudentReport);

module.exports = router;
