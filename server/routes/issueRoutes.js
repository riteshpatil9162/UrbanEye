const express = require('express');
const router = express.Router();
const {
  validateImage,
  reportIssue,
  getIssues,
  getIssue,
  getMyIssues,
  likeIssue,
  confirmResolution,
} = require('../controllers/issueController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getIssues);
router.get('/my-issues', protect, authorize('citizen'), getMyIssues);
router.get('/:id', protect, getIssue);
router.post('/', protect, authorize('citizen'), upload.single('image'), reportIssue);
// Validate image against issue type (Gemini Vision) — before full submission
router.post('/validate-image', protect, authorize('citizen'), upload.single('image'), validateImage);
// Any citizen can like any issue in their area
router.put('/:id/like', protect, authorize('citizen'), likeIssue);
router.put('/:id/confirm', protect, authorize('citizen'), confirmResolution);

module.exports = router;
