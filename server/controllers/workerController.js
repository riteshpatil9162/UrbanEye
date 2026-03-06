const Issue = require('../models/Issue');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const { analyzeResolutionProof } = require('../services/aiService');
const { getDistanceMatrix } = require('../services/mapService');
const createNotification = require('../utils/createNotification');

// @desc    Get worker's assigned issues
// @route   GET /api/worker/issues
// @access  Private (Worker)
const getWorkerIssues = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { assignedTo: req.user._id };
    if (status) query.status = status;

    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email phone area')
      .sort({ createdAt: -1 });

    res.json({ success: true, issues });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept assigned issue
// @route   PUT /api/worker/issues/:id/accept
// @access  Private (Worker)
const acceptIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    const io = req.app.get('io');

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    if (issue.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your assigned issue.' });
    }

    issue.status = 'in-progress';
    await issue.save();

    await createNotification(
      issue.reportedBy,
      `A worker has started working on your issue "${issue.title}".`,
      'issue_in_progress',
      issue._id,
      io
    );

    res.json({ success: true, message: 'Issue accepted and in progress.', issue });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject assigned issue
// @route   PUT /api/worker/issues/:id/reject
// @access  Private (Worker)
const rejectIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    if (issue.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your assigned issue.' });
    }

    issue.assignedTo = null;
    issue.status = 'pending';
    await issue.save();

    // Mark worker as available again
    await User.findByIdAndUpdate(req.user._id, { isAvailable: true });

    res.json({ success: true, message: 'Issue returned for reassignment.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload resolution proof
// @route   PUT /api/worker/issues/:id/resolve
// @access  Private (Worker)
const uploadResolutionProof = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const io = req.app.get('io');

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    if (issue.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your assigned issue.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resolution proof image is required.' });
    }

    if (notes) issue.workerNotes = notes;

    // AI Resolution Analysis — run BEFORE Cloudinary upload to avoid wasting storage on rejections
    const aiAnalysis = await analyzeResolutionProof(
      issue.issueType,
      issue.description,
      notes || '',
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    issue.aiResolutionScore = aiAnalysis.resolutionScore;

    // Block submission if AI determines the issue is NOT resolved
    if (aiAnalysis.isResolved === false) {
      return res.status(422).json({
        success: false,
        message: 'Proof rejected: AI determined the issue is not resolved.',
        aiAnalysis,
      });
    }

    // Upload proof image only after AI approves
    const uploadResult = await uploadToCloudinary(req.file.buffer, 'urbaneye/resolutions');
    issue.afterImage = uploadResult.secure_url;
    issue.proofUploaded = true;

    // Keep status as 'in-progress' — officer will verify and move to 'resolved'
    await issue.save();

    // Notify officers
    const officers = await User.find({ role: 'officer' });
    for (const officer of officers) {
      await createNotification(
        officer._id,
        `Worker uploaded resolution proof for "${issue.title}" in ${issue.area}. Please verify.`,
        'issue_in_progress',
        issue._id,
        io
      );
    }

    res.json({
      success: true,
      message: 'Resolution proof uploaded. Awaiting officer verification.',
      aiAnalysis,
      issue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get optimized route for worker
// @route   GET /api/worker/route
// @access  Private (Worker)
const getOptimizedRoute = async (req, res, next) => {
  try {
    const issues = await Issue.find({
      assignedTo: req.user._id,
      status: { $in: ['assigned', 'in-progress'] },
    });

    if (!issues.length) {
      return res.json({ success: true, message: 'No active issues.', route: [] });
    }

    const workerLocation = req.user.location || { lat: 16.7050, lng: 74.2433 }; // Default Kolhapur

    const distances = await getDistanceMatrix(
      workerLocation,
      issues.map((i) => i.location)
    );

    const routeWithDistances = issues.map((issue, idx) => ({
      issue: {
        _id: issue._id,
        title: issue.title,
        issueType: issue.issueType,
        area: issue.area,
        location: issue.location,
        status: issue.status,
      },
      distance: distances[idx]?.distanceText || 'N/A',
      duration: distances[idx]?.durationText || 'N/A',
      distanceValue: distances[idx]?.distance || 0,
    }));

    // Sort by distance
    routeWithDistances.sort((a, b) => a.distanceValue - b.distanceValue);

    res.json({ success: true, route: routeWithDistances });
  } catch (error) {
    next(error);
  }
};

// @desc    Update worker availability
// @route   PUT /api/worker/availability
// @access  Private (Worker)
const updateAvailability = async (req, res, next) => {
  try {
    const { isAvailable, location } = req.body;
    const update = { isAvailable };
    if (location) update.location = location;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json({ success: true, message: 'Availability updated.', isAvailable: user.isAvailable });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkerIssues, acceptIssue, rejectIssue, uploadResolutionProof, getOptimizedRoute, updateAvailability };
