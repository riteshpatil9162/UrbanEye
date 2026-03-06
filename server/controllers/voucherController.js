const Voucher = require('../models/Voucher');
const User = require('../models/User');
const createNotification = require('../utils/createNotification');

// @desc    Create voucher (Officer)
// @route   POST /api/vouchers
// @access  Private (Officer)
const createVoucher = async (req, res, next) => {
  try {
    const { title, description, pointsRequired, expiryDate, totalQuantity, category } = req.body;

    const voucher = await Voucher.create({
      title,
      description,
      pointsRequired,
      expiryDate,
      totalQuantity: totalQuantity || null,
      category: category || 'Other',
      createdBy: req.user._id,
    });

    // Notify all citizens
    const citizens = await User.find({ role: 'citizen' });
    const io = req.app.get('io');
    for (const citizen of citizens) {
      await createNotification(
        citizen._id,
        `New reward voucher available: "${title}" for ${pointsRequired} points!`,
        'voucher_added',
        null,
        io
      );
    }

    res.status(201).json({ success: true, message: 'Voucher created.', voucher });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active vouchers
// @route   GET /api/vouchers
// @access  Private
const getVouchers = async (req, res, next) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({ isActive: true, expiryDate: { $gte: now } })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, vouchers });
  } catch (error) {
    next(error);
  }
};

// @desc    Redeem a voucher
// @route   POST /api/vouchers/:id/redeem
// @access  Private (Citizen)
const redeemVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    const io = req.app.get('io');

    if (!voucher || !voucher.isActive) {
      return res.status(404).json({ success: false, message: 'Voucher not found or inactive.' });
    }

    if (new Date(voucher.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Voucher has expired.' });
    }

    const user = await User.findById(req.user._id);

    if (user.points < voucher.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You need ${voucher.pointsRequired} points but have ${user.points}.`,
      });
    }

    if (voucher.redeemedBy.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You have already redeemed this voucher.' });
    }

    if (voucher.totalQuantity !== null && voucher.redeemedBy.length >= voucher.totalQuantity) {
      return res.status(400).json({ success: false, message: 'Voucher is fully claimed.' });
    }

    // Deduct points & add to redeemed list
    user.points -= voucher.pointsRequired;
    user.redeemedVouchers.push(voucher._id);
    await user.save();

    voucher.redeemedBy.push(req.user._id);
    await voucher.save();

    await createNotification(
      req.user._id,
      `You successfully redeemed "${voucher.title}" for ${voucher.pointsRequired} points!`,
      'reward_earned',
      null,
      io
    );

    res.json({ success: true, message: 'Voucher redeemed successfully!', remainingPoints: user.points });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/deactivate voucher (Officer)
// @route   DELETE /api/vouchers/:id
// @access  Private (Officer)
const deleteVoucher = async (req, res, next) => {
  try {
    await Voucher.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Voucher deactivated.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createVoucher, getVouchers, redeemVoucher, deleteVoucher };
