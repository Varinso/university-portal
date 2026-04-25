const express = require('express');

const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { getInstructorDashboard } = require('../controllers/instructors.controller');

const router = express.Router();

router.use(auth, authorize('Instructor'));
router.get('/me/dashboard', getInstructorDashboard);

module.exports = router;
