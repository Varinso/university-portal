const express = require('express');

const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../utils/validators');
const {
  createSubmissionValidation,
  updateSubmissionValidation,
  listSubmissions,
  createSubmission,
  updateSubmission
} = require('../controllers/submissions.controller');

const router = express.Router();

router.use(auth);
router.get('/', listSubmissions);
router.post('/', authorize('Student'), createSubmissionValidation, validate, createSubmission);
router.patch('/:id', authorize('Instructor'), updateSubmissionValidation, validate, updateSubmission);

module.exports = router;
