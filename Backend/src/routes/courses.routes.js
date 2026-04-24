const express = require('express');

const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../utils/validators');
const {
  createCourseValidation,
  listCourses,
  createCourse
} = require('../controllers/courses.controller');

const router = express.Router();

router.use(auth);
router.get('/', listCourses);
router.post('/', authorize('Instructor'), createCourseValidation, validate, createCourse);

module.exports = router;
