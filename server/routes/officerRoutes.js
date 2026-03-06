const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getOfficerIssues,
  getOfficerIssueDetail,
  verifyIssue,
  assignIssue,
  rejectIssue,
  verifyResolution,
  getWorkers,
  createStaff,
} = require('../controllers/officerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('officer'));

router.get('/stats', getDashboardStats);
router.get('/issues', getOfficerIssues);
router.get('/issues/:id', getOfficerIssueDetail);
router.put('/issues/:id/verify', verifyIssue);
router.put('/issues/:id/assign', assignIssue);
router.put('/issues/:id/reject', rejectIssue);
router.put('/issues/:id/verify-resolution', verifyResolution);
router.get('/workers', getWorkers);
router.post('/staff', createStaff);

module.exports = router;
