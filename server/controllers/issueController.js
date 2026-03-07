const Issue = require('../models/Issue');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const { analyzeIssueAuthenticity, validateImageMatchesIssue } = require('../services/aiService');
const { findNearestWorker } = require('../services/mapService');
const createNotification = require('../utils/createNotification');

// @desc    Validate uploaded image against issue type using Gemini Vision
// @route   POST /api/issues/validate-image
// @access  Private (Citizen)
const validateImage = async (req, res, next) => {
  try {
    const { issueType, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required for validation.' });
    }
    if (!issueType) {
      return res.status(400).json({ success: false, message: 'Issue type is required for validation.' });
    }

    const result = await validateImageMatchesIssue(
      req.file.buffer,
      req.file.mimetype,
      issueType,
      description || '',
      req.file.originalname
    );

    res.json({ success: true, validation: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a new issue
// @route   POST /api/issues
// @access  Private (Citizen)
const reportIssue = async (req, res, next) => {
  try {
    const { title, description, issueType, area, lat, lng } = req.body;
    const io = req.app.get('io');

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Issue image is required.' });
    }

    // ── Gemini Vision: verify image matches issue type before accepting ──
    const imageValidation = await validateImageMatchesIssue(
      req.file.buffer,
      req.file.mimetype,
      issueType,
      description || '',
      req.file.originalname
    );

    if (!imageValidation.imageMatchesIssue) {
      return res.status(422).json({
        success: false,
        message: 'Image does not match the selected issue type.',
        validation: imageValidation,
      });
    }

    // Upload image to Cloudinary (only after AI approves)
    const uploadResult = await uploadToCloudinary(req.file.buffer, 'urbaneye/issues');

    // AI Authenticity Analysis (text-based scoring)
    const aiAnalysis = await analyzeIssueAuthenticity(issueType, description);

    const issue = await Issue.create({
      title,
      description,
      issueType,
      image: uploadResult.secure_url,
      beforeImage: uploadResult.secure_url,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      area,
      reportedBy: req.user._id,
      aiAuthenticityScore: aiAnalysis.confidenceScore,
      aiFraudProbability: aiAnalysis.fraudProbability,
      aiImageMatch: imageValidation.imageMatchesIssue,
    });

    await issue.populate('reportedBy', 'name email area');

    // Notify all citizens in the same area
    const areaUsers = await User.find({ area, role: 'citizen', _id: { $ne: req.user._id } });
    for (const areaUser of areaUsers) {
      await createNotification(
        areaUser._id,
        `New ${issueType} reported in your area (${area}): "${title}"`,
        'area_issue',
        issue._id,
        io
      );
    }

    // Notify all officers
    const officers = await User.find({ role: 'officer' });
    for (const officer of officers) {
      await createNotification(
        officer._id,
        `New issue reported in ${area}: ${issueType} - "${title}"`,
        'issue_reported',
        issue._id,
        io
      );
    }

    // Emit area live update
    if (io) {
      io.to(`area_${area}`).emit('new_issue', {
        _id: issue._id,
        title: issue.title,
        issueType: issue.issueType,
        area: issue.area,
        likes: 0,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully.',
      issue,
      aiAnalysis,
      imageValidation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issues (with filters)
// @route   GET /api/issues
// @access  Private
const getIssues = async (req, res, next) => {
  try {
    const { area, status, issueType, page = 1, limit = 10, search } = req.query;

    const query = {};
    if (area) query.area = { $regex: area, $options: 'i' };
    if (status) query.status = status;
    if (issueType) query.issueType = issueType;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Citizens see ALL cities' issues in the community feed (no area restriction)

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email area')
      .populate('assignedTo', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      issues,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Private
const getIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email area avatar')
      .populate('assignedTo', 'name email phone area');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    res.json({ success: true, issue });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my reported issues
// @route   GET /api/issues/my-issues
// @access  Private (Citizen)
const getMyIssues = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { reportedBy: req.user._id };
    if (status) query.status = status;

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate('assignedTo', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), issues });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike an issue — any citizen can like any issue
// @route   PUT /api/issues/:id/like
// @access  Private (Citizen)
const likeIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    const io = req.app.get('io');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    // Citizens can only like issues in their own area
    if (req.user.role === 'citizen') {
      const sameArea = issue.area.toLowerCase().includes(req.user.area.toLowerCase()) ||
        req.user.area.toLowerCase().includes(issue.area.toLowerCase());
      if (!sameArea) {
        return res.status(403).json({ success: false, message: 'You can only like issues in your area.' });
      }
    }

    const userId = req.user._id;
    const alreadyLiked = issue.likedBy.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      issue.likedBy = issue.likedBy.filter((id) => id.toString() !== userId.toString());
      issue.likes = Math.max(0, issue.likes - 1);
    } else {
      issue.likedBy.push(userId);
      issue.likes += 1;
    }

    await issue.save();

    // Auto-assign if >= 5 likes and not already assigned
    if (issue.likes >= 5 && issue.status === 'pending' && !issue.autoAssigned) {
      const availableWorkers = await User.find({ role: 'worker', isAvailable: true });

      if (availableWorkers.length > 0) {
        const nearestWorker = findNearestWorker(issue.location, availableWorkers);

        issue.assignedTo = nearestWorker._id;
        issue.status = 'assigned';
        issue.autoAssigned = true;
        await issue.save();

        nearestWorker.isAvailable = false;
        await nearestWorker.save();

        // Notify worker
        await createNotification(
          nearestWorker._id,
          `Auto-assigned: ${issue.issueType} in ${issue.area} - "${issue.title}"`,
          'auto_assigned',
          issue._id,
          io
        );

        // Notify officers
        const officers = await User.find({ role: 'officer' });
        for (const officer of officers) {
          await createNotification(
            officer._id,
            `Issue auto-assigned (5+ likes): "${issue.title}" → ${nearestWorker.name}`,
            'auto_assigned',
            issue._id,
            io
          );
        }
      }
    }

    // Emit live like count update
    if (io) {
      io.to(`area_${issue.area}`).emit('like_update', {
        issueId: issue._id,
        likes: issue.likes,
        autoAssigned: issue.autoAssigned,
      });
    }

    res.json({
      success: true,
      liked: !alreadyLiked,
      likes: issue.likes,
      autoAssigned: issue.autoAssigned,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Citizen confirms resolution
// @route   PUT /api/issues/:id/confirm
// @access  Private (Citizen)
const confirmResolution = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    const io = req.app.get('io');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    if (issue.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (issue.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Issue is not yet resolved.' });
    }

    // Give 50 reward points
    if (!issue.rewardGiven) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: 50 } });
      issue.rewardGiven = true;
      await issue.save();

      await createNotification(
        req.user._id,
        `You earned 50 points for confirming resolution of "${issue.title}"!`,
        'reward_earned',
        issue._id,
        io
      );
    }

    res.json({ success: true, message: 'Resolution confirmed. 50 points awarded!' });
  } catch (error) {
    next(error);
  }
};

module.exports = { validateImage, reportIssue, getIssues, getIssue, getMyIssues, likeIssue, confirmResolution };
