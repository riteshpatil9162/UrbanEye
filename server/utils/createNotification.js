const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('../services/emailService');

const createNotification = async (userId, message, type, relatedIssue = null, io = null) => {
  try {
    const notification = await Notification.create({
      user: userId,
      message,
      type,
      relatedIssue,
    });

    // Emit real-time notification if socket.io is available
    if (io) {
      io.to(userId.toString()).emit('notification', {
        _id: notification._id,
        message,
        type,
        relatedIssue,
        readStatus: false,
        createdAt: notification.createdAt,
      });
    }

    // Send email notification (non-blocking)
    const user = await User.findById(userId).select('email name');
    if (user?.email) {
      sendNotificationEmail(user.email, user.name, message, type);
    }

    return notification;
  } catch (error) {
    console.error('Create Notification Error:', error.message);
  }
};

module.exports = createNotification;
