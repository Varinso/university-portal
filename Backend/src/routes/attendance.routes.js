const express = require('express');

const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../utils/validators');
const {
  saveAttendanceValidation,
  getMyAttendance,
  listAttendanceForInstructor,
  saveAttendance
} = require('../controllers/attendance.controller');

const router = express.Router();

router.use(auth);
router.get('/me', authorize('Student'), getMyAttendance);
router.get('/', authorize('Instructor'), listAttendanceForInstructor);
router.put('/', authorize('Instructor'), saveAttendanceValidation, validate, saveAttendance);

module.exports = router;
