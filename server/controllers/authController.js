const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, area, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Public registration is restricted to citizens only
    if (role && role !== 'citizen') {
      return res.status(403).json({ success: false, message: 'Only citizen accounts can be created via registration. Contact your officer to create worker or officer accounts.' });
    }

    const user = await User.create({ name, email, password, role: 'citizen', area, phone });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        area: user.area,
        points: user.points,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        area: user.area,
        points: user.points,
        avatar: user.avatar,
        isAvailable: user.isAvailable,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('redeemedVouchers', 'title pointsRequired');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, area, location } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, area, location },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users grouped by role for demo quick-login (public, hackathon only)
// @route   GET /api/auth/demo-users
// @access  Public
const getDemoUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: { $ne: false } })
      .select('name email role area')
      .sort({ role: 1, name: 1 });

    const grouped = { citizen: [], officer: [], worker: [] };
    for (const u of users) {
      const token = generateToken(u._id, u.role);
      const entry = { _id: u._id, name: u.name, email: u.email, area: u.area, token };
      if (grouped[u.role] !== undefined) grouped[u.role].push(entry);
    }

    res.json({ success: true, users: grouped });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, getDemoUsers };
