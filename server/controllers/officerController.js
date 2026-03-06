const Issue = require('../models/Issue');
const User = require('../models/User');
const { analyzeResolutionProof } = require('../services/aiService');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const createNotification = require('../utils/createNotification');

// @desc    Get officer dashboard stats
// @route   GET /api/officer/stats
// @access  Private (Officer)
const getDashboardStats = async (req, res, next) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({ status: 'pending' });
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
    const inProgressIssues = await Issue.countDocuments({ status: 'in-progress' });
    const assignedIssues = await Issue.countDocuments({ status: 'assigned' });
    const rejectedIssues = await Issue.countDocuments({ status: 'rejected' });

    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const availableWorkers = await User.countDocuments({ role: 'worker', isAvailable: true });

    const resolutionRate = totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : 0;

    // Area-wise issue count
    const areaStats = await Issue.aggregate([
      { $group: { _id: '$area', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Issue type distribution
    const typeStats = await Issue.aggregate([
      { $group: { _id: '$issueType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrends = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          reported: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Recently assigned issues with worker names
    const recentAssignments = await Issue.find({ status: { $in: ['assigned', 'in-progress'] }, assignedTo: { $ne: null } })
      .populate('assignedTo', 'name email phone')
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title issueType area status assignedTo updatedAt');

    res.json({
      success: true,
      stats: {
        totalIssues,
        pendingIssues,
        resolvedIssues,
        inProgressIssues,
        assignedIssues,
        rejectedIssues,
        resolutionRate: parseFloat(resolutionRate),
        totalWorkers,
        availableWorkers,
      },
      areaStats,
      typeStats,
      monthlyTrends,
      recentAssignments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issues for officer
// @route   GET /api/officer/issues
// @access  Private (Officer)
const getOfficerIssues = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, area, issueType } = req.query;
    const query = {};
    if (status) query.status = status;
    if (area) query.area = { $regex: area, $options: 'i' };
    if (issueType) query.issueType = issueType;

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email area')
      .populate('assignedTo', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), issues });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single issue details for officer (to view before verifying/assigning)
// @route   GET /api/officer/issues/:id
// @access  Private (Officer)
const getOfficerIssueDetail = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email area phone avatar')
      .populate('assignedTo', 'name email phone area');

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    res.json({ success: true, issue });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify issue (officer must do this before assigning)
// @route   PUT /api/officer/issues/:id/verify
// @access  Private (Officer)
const verifyIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    const io = req.app.get('io');

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });
    if (issue.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Issue is already ${issue.status}. Only pending issues can be verified.` });
    }

    issue.status = 'verified';
    await issue.save();

    await createNotification(
      issue.reportedBy,
      `Your issue "${issue.title}" has been verified by the officer.`,
      'issue_verified',
      issue._id,
      io
    );

    res.json({ success: true, message: 'Issue verified successfully. You can now assign it to a worker.', issue });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign issue to worker — only allowed after verification
// @route   PUT /api/officer/issues/:id/assign
// @access  Private (Officer)
const assignIssue = async (req, res, next) => {
  try {
    const { workerId } = req.body;
    const io = req.app.get('io');

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    // Enforce: must be verified before assigning
    if (issue.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Issue must be verified before it can be assigned. Please verify the issue first.',
      });
    }
    if (!['verified'].includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign an issue with status "${issue.status}". Only verified issues can be assigned.`,
      });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') {
      return res.status(400).json({ success: false, message: 'Invalid worker.' });
    }
    if (!worker.isAvailable) {
      return res.status(400).json({ success: false, message: `Worker "${worker.name}" is not available.` });
    }

    issue.assignedTo = workerId;
    issue.status = 'assigned';
    await issue.save();

    worker.isAvailable = false;
    await worker.save();

    // Re-populate assignedTo so worker name is returned in response
    await issue.populate('assignedTo', 'name email phone area');

    await createNotification(
      workerId,
      `New issue assigned to you: ${issue.issueType} in ${issue.area} - "${issue.title}"`,
      'issue_assigned',
      issue._id,
      io
    );

    await createNotification(
      issue.reportedBy,
      `Your issue "${issue.title}" has been assigned to worker ${worker.name}.`,
      'issue_assigned',
      issue._id,
      io
    );

    res.json({
      success: true,
      message: `Issue assigned to ${worker.name} successfully.`,
      issue,
      assignedWorker: { _id: worker._id, name: worker.name, email: worker.email, phone: worker.phone },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject issue
// @route   PUT /api/officer/issues/:id/reject
// @access  Private (Officer)
const rejectIssue = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const io = req.app.get('io');

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    issue.status = 'rejected';
    issue.rejectionReason = reason || 'Issue does not meet reporting criteria.';
    await issue.save();

    await createNotification(
      issue.reportedBy,
      `Your issue "${issue.title}" was rejected. Reason: ${issue.rejectionReason}`,
      'issue_rejected',
      issue._id,
      io
    );

    res.json({ success: true, message: 'Issue rejected.', issue });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify resolution proof from worker
// @route   PUT /api/officer/issues/:id/verify-resolution
// @access  Private (Officer)
const verifyResolution = async (req, res, next) => {
  try {
    const { approved, workerNotes } = req.body;
    const io = req.app.get('io');

    const issue = await Issue.findById(req.params.id).populate('assignedTo');
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    if (approved) {
      issue.status = 'resolved';
      issue.resolvedAt = new Date();

      if (issue.assignedTo) {
        await User.findByIdAndUpdate(issue.assignedTo._id, { isAvailable: true });
      }

      await createNotification(
        issue.reportedBy,
        `Great news! Your issue "${issue.title}" has been resolved. Please confirm.`,
        'issue_resolved',
        issue._id,
        io
      );
    } else {
      // Reassign back
      issue.status = 'assigned';
      await createNotification(
        issue.assignedTo._id,
        `Resolution proof rejected for "${issue.title}". Please re-attempt.`,
        'issue_assigned',
        issue._id,
        io
      );
    }

    await issue.save();

    res.json({ success: true, message: approved ? 'Issue resolved.' : 'Resolution rejected, worker notified.', issue });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workers for officer
// @route   GET /api/officer/workers
// @access  Private (Officer)
const getWorkers = async (req, res, next) => {
  try {
    const workers = await User.find({ role: 'worker' }).select('-password');
    const workersWithStats = await Promise.all(
      workers.map(async (w) => {
        const totalAssigned = await Issue.countDocuments({ assignedTo: w._id });
        const resolved = await Issue.countDocuments({ assignedTo: w._id, status: 'resolved' });
        const activeIssue = await Issue.findOne({ assignedTo: w._id, status: { $in: ['assigned', 'in-progress'] } })
          .select('title issueType area status');
        return {
          ...w.toObject(),
          totalAssigned,
          resolved,
          efficiency: totalAssigned > 0 ? ((resolved / totalAssigned) * 100).toFixed(0) : 0,
          activeIssue: activeIssue || null,
        };
      })
    );
    res.json({ success: true, workers: workersWithStats });
  } catch (error) {
    next(error);
  }
};

// @desc    Create worker or officer account (officer only)
// @route   POST /api/officer/staff
// @access  Private (Officer)
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, area, phone } = req.body;

    if (!['worker', 'officer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be worker or officer.' });
    }
    if (!name || !email || !password || !area) {
      return res.status(400).json({ success: false, message: 'Name, email, password and area are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name, email, password,
      role,
      area,
      phone: phone || '',
      isAvailable: role === 'worker' ? true : undefined,
    });

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, area: user.area },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getOfficerIssues,
  getOfficerIssueDetail,
  verifyIssue,
  assignIssue,
  rejectIssue,
  verifyResolution,
  getWorkers,
  createStaff,
};
