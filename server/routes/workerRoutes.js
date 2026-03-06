const express = require('express');
const router = express.Router();
const {
  getWorkerIssues,
  acceptIssue,
  rejectIssue,
  uploadResolutionProof,
  getOptimizedRoute,
  updateAvailability,
} = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, authorize('worker'));

router.get('/issues', getWorkerIssues);
router.put('/issues/:id/accept', acceptIssue);
router.put('/issues/:id/reject', rejectIssue);
router.put('/issues/:id/resolve', upload.single('afterImage'), uploadResolutionProof);
router.get('/route', getOptimizedRoute);
router.put('/availability', updateAvailability);

module.exports = router;
