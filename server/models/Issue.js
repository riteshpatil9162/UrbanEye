const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    issueType: {
      type: String,
      enum: ['Pothole', 'Waste Overflow', 'Water Leakage', 'Electricity Fault', 'Sewage Blockage'],
      required: [true, 'Issue type is required'],
    },
    image: {
      type: String, // Cloudinary URL
      required: [true, 'Issue image is required'],
    },
    beforeImage: {
      type: String, // Cloudinary URL - original citizen image
    },
    afterImage: {
      type: String, // Cloudinary URL - worker resolution proof
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'assigned', 'in-progress', 'resolved', 'rejected'],
      default: 'pending',
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    aiAuthenticityScore: {
      type: Number, // 0-100
      default: null,
    },
    aiResolutionScore: {
      type: Number, // 0-100
      default: null,
    },
    aiFraudProbability: {
      type: Number, // 0-100
      default: null,
    },
    aiImageMatch: {
      type: Boolean,
      default: null,
    },
    autoAssigned: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    rewardGiven: {
      type: Boolean,
      default: false,
    },
    proofUploaded: {
      type: Boolean,
      default: false,
    },
    workerNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for geospatial queries and area-based filtering
issueSchema.index({ area: 1, status: 1 });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema);
