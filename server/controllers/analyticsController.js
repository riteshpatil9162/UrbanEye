const Issue = require('../models/Issue');
const User = require('../models/User');

// @desc    Get analytics data
// @route   GET /api/analytics
// @access  Private (Officer)
const getAnalytics = async (req, res, next) => {
  try {
    // Issue status distribution
    const statusDistribution = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Top areas by issue count
    const topAreas = await Issue.aggregate([
      { $group: { _id: '$area', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]);

    // Issue type distribution
    const issueTypes = await Issue.aggregate([
      { $group: { _id: '$issueType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Worker performance
    const workerPerformance = await Issue.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'worker',
        },
      },
      { $unwind: '$worker' },
      {
        $project: {
          name: '$worker.name',
          area: '$worker.area',
          total: 1,
          resolved: 1,
          efficiency: { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
        },
      },
      { $sort: { resolved: -1 } },
      { $limit: 10 },
    ]);

    // Resolution time trend (avg days to resolve)
    const resolutionTimes = await Issue.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $ne: null } } },
      {
        $project: {
          area: 1,
          issueType: 1,
          resolutionDays: {
            $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60 * 24],
          },
        },
      },
      {
        $group: {
          _id: '$issueType',
          avgDays: { $avg: '$resolutionDays' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          reported: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      statusDistribution,
      topAreas,
      issueTypes,
      workerPerformance,
      resolutionTimes,
      monthlyTrend,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
