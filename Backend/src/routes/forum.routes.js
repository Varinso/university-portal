const express = require('express');

const { auth } = require('../middleware/auth');
const { validate } = require('../utils/validators');
const {
  createForumPostValidation,
  listForumPosts,
  createForumPost
} = require('../controllers/forum.controller');

const router = express.Router();

router.use(auth);
router.get('/', listForumPosts);
router.post('/', createForumPostValidation, validate, createForumPost);

module.exports = router;
