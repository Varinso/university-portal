const express = require('express');

const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../utils/validators');
const {
  createAssignmentValidation,
  listAssignments,
  createAssignment
} = require('../controllers/assignments.controller');

const router = express.Router();

router.use(auth);
router.get('/', listAssignments);
router.post('/', authorize('Instructor'), createAssignmentValidation, validate, createAssignment);

module.exports = router;
