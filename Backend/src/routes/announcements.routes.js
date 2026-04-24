const express = require('express');

const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../utils/validators');
const {
  createAnnouncementValidation,
  listAnnouncements,
  createAnnouncement
} = require('../controllers/announcements.controller');

const router = express.Router();

router.use(auth);
router.get('/', listAnnouncements);
router.post('/', authorize('Instructor'), createAnnouncementValidation, validate, createAnnouncement);

module.exports = router;
