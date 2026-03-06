const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Icon + color per notification type
const TYPE_META = {
  issue_pending:     { color: '#6366f1', label: 'Issue Submitted',       icon: '📋' },
  issue_verified:    { color: '#3b82f6', label: 'Issue Verified',         icon: '✅' },
  issue_assigned:    { color: '#f59e0b', label: 'Issue Assigned',         icon: '👷' },
  issue_in_progress: { color: '#8b5cf6', label: 'Work In Progress',       icon: '🔧' },
  issue_resolved:    { color: '#10b981', label: 'Issue Resolved',         icon: '🎉' },
  issue_rejected:    { color: '#ef4444', label: 'Issue Rejected',         icon: '❌' },
  reward_earned:     { color: '#f59e0b', label: 'Reward Points Earned',   icon: '🏆' },
};

const buildHtml = (message, type, recipientName) => {
  const meta = TYPE_META[type] || { color: '#1d4ed8', label: 'Notification', icon: '🔔' };
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${meta.label} — UrbanEye</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1d4ed8;border-radius:12px;padding:10px 14px;vertical-align:middle;">
                    <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">Urban<span style="color:#93c5fd;">Eye</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">

              <!-- Colored top bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${meta.color};padding:28px 32px;">
                    <div style="font-size:32px;margin-bottom:8px;">${meta.icon}</div>
                    <div style="color:#ffffff;font-size:20px;font-weight:700;">${meta.label}</div>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px;">
                    <p style="margin:0 0 8px 0;color:#374151;font-size:15px;">
                      Hi <strong>${recipientName}</strong>,
                    </p>
                    <p style="margin:0 0 24px 0;color:#4b5563;font-size:15px;line-height:1.6;">
                      ${message}
                    </p>

                    <a href="${process.env.CLIENT_URL}" style="display:inline-block;background:${meta.color};color:#fff;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:600;">
                      Open UrbanEye Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      This is an automated notification from <strong>UrbanEye</strong> — Smart Municipal Issue Reporting, Kolhapur District.
                      <br/>Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Send a notification email to a user.
 * @param {string} toEmail  - recipient email
 * @param {string} toName   - recipient name (for greeting)
 * @param {string} message  - notification message body
 * @param {string} type     - notification type key
 */
const sendNotificationEmail = async (toEmail, toName, message, type) => {
  try {
    const meta = TYPE_META[type] || { label: 'Notification', icon: '🔔' };
    await transporter.sendMail({
      from: `"UrbanEye Notifications" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${meta.icon} ${meta.label} — UrbanEye`,
      html: buildHtml(message, type, toName),
    });
  } catch (err) {
    // Non-fatal — log but never crash the main flow
    console.error(`[EmailService] Failed to send to ${toEmail}:`, err.message);
  }
};

module.exports = { sendNotificationEmail };
