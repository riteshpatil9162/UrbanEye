const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'issue_reported',
        'issue_verified',
        'issue_assigned',
        'issue_in_progress',
        'issue_resolved',
        'issue_rejected',
        'issue_liked',
        'auto_assigned',
        'voucher_added',
        'reward_earned',
        'area_issue',
      ],
      default: 'issue_reported',
    },
    relatedIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    readStatus: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, readStatus: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
