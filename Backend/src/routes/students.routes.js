const express = require('express');

const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
  getMyDashboard,
  getMyCourses,
  listStudents
} = require('../controllers/students.controller');

const router = express.Router();

router.use(auth);

router.get('/me/dashboard', authorize('Student'), getMyDashboard);
router.get('/me/courses', authorize('Student'), getMyCourses);
router.get('/', authorize('Instructor'), listStudents);

module.exports = router;
