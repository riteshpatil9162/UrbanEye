const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Voucher title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    pointsRequired: {
      type: Number,
      required: [true, 'Points required is mandatory'],
      min: 1,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    redeemedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalQuantity: {
      type: Number,
      default: null, // null = unlimited
    },
    category: {
      type: String,
      enum: ['Food', 'Transport', 'Shopping', 'Healthcare', 'Education', 'Other'],
      default: 'Other',
    },
  },
  { timestamps: true }
);

voucherSchema.index({ isActive: 1, expiryDate: 1 });

module.exports = mongoose.model('Voucher', voucherSchema);
