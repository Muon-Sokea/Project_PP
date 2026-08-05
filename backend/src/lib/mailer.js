const nodemailer = require("nodemailer");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Parses `"Name" <email@x.com>` (or a bare email) into Brevo's {name, email} shape.
function parseFrom(fromStr) {
  const match = String(fromStr || "").match(/^"?([^"<]*)"?\s*<(.+)>$/);
  if (match) return { name: match[1].trim() || undefined, email: match[2].trim() };
  return { email: String(fromStr || "").trim() };
}

// Sends via Brevo's HTTP API (port 443) whenever BREVO_API_KEY is set. Many
// cloud hosts (Railway included) silently block outbound SMTP (port 587) to
// prevent spam-relay abuse, which makes the transporter below hang until
// timeout in production — the HTTP API sidesteps that entirely. Falls back
// to plain SMTP for local dev, where the API key usually isn't configured.
async function sendMail({ from, to, subject, html }) {
  if (BREVO_API_KEY) {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: parseFrom(from),
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Brevo API error ${res.status}: ${body}`);
    }
    return;
  }
  await transporter.sendMail({ from, to, subject, html });
}

function isEmailConfigured() {
  return !!(BREVO_API_KEY || process.env.SMTP_USER);
}

// Lightweight connectivity check for the system-health endpoint.
async function verifyEmailService() {
  if (BREVO_API_KEY) {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": BREVO_API_KEY, "Accept": "application/json" },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Brevo API error ${res.status}: ${body}`);
    }
    return;
  }
  await transporter.verify();
}

/**
 * Send a 6-digit OTP email.
 * @param {string} to      - recipient address
 * @param {string} otp     - the 6-digit code
 * @param {string} purpose - short label shown in the email body, e.g. "password reset"
 */
async function sendOtpEmail(to, otp, purpose = "verification") {
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;
              padding:40px 32px;background:#ffffff;border-radius:12px;
              border:1px solid #e5e7f0">
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#F5A623">
      Planning Center
    </p>
    <p style="margin:0 0 28px;font-size:14px;color:#8888a0">
      Event Registration &amp; Management
    </p>
    <p style="font-size:15px;color:#1a1a2e;margin:0 0 8px">
      Here is your ${purpose} code:
    </p>
    <div style="background:#f7f8fc;border-radius:10px;padding:28px 16px;
                text-align:center;margin:0 0 24px;letter-spacing:14px">
      <span style="font-size:40px;font-weight:700;color:#1a1a2e;
                   font-variant-numeric:tabular-nums">${otp}</span>
    </div>
    <p style="font-size:13px;color:#8888a0;margin:0">
      This code expires in <strong>10 minutes</strong>.
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>`;

  await sendMail({
    from:    process.env.SMTP_FROM || `"Planning Center" <${process.env.SMTP_USER}>`,
    to,
    subject: `${otp} is your Planning Center code`,
    html,
  });
}

/**
 * Build a reusable notification email shell.
 */
function notificationShell(title, bodyContent) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;
              padding:36px 32px;background:#ffffff;border-radius:14px;
              border:1px solid #e5e7f0;box-shadow:0 4px 20px rgba(0,0,0,0.04)">
    <div style="border-bottom:1px solid #f0f0f5;padding-bottom:16px;margin-bottom:24px">
      <p style="margin:0;font-size:20px;font-weight:700;color:#F5A623">
        Planning Center
      </p>
      <p style="margin:4px 0 0;font-size:13px;color:#8888a0">
        Event Registration &amp; Management
      </p>
    </div>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1a1a2e">
      ${title}
    </h2>
    ${bodyContent}
    <div style="border-top:1px solid #f0f0f5;margin-top:28px;padding-top:16px">
      <p style="margin:0;font-size:12px;color:#a0a0b8">
        You received this email because you have notifications enabled in your Planning Center account.
        <br>To update your preferences, visit your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="color:#F5A623">dashboard settings</a>.
      </p>
    </div>
  </div>`;
}

/**
 * Send an event reminder notification.
 */
async function sendEventReminderEmail(to, { eventTitle, eventDate, eventTime, eventLocation, ticketCode }) {
  const body = `
    <div style="background:#f7f8fc;border-radius:10px;padding:20px;margin:0 0 16px">
      <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a1a2e">${eventTitle}</p>
      <table style="font-size:13px;color:#555;border-collapse:collapse">
        <tr><td style="padding:3px 12px 3px 0;color:#8888a0">Date</td><td style="padding:3px 0;font-weight:500">${eventDate}</td></tr>
        ${eventTime ? `<tr><td style="padding:3px 12px 3px 0;color:#8888a0">Time</td><td style="padding:3px 0;font-weight:500">${eventTime}</td></tr>` : ''}
        <tr><td style="padding:3px 12px 3px 0;color:#8888a0">Location</td><td style="padding:3px 0;font-weight:500">${eventLocation}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#8888a0">Ticket</td><td style="padding:3px 0;font-weight:500">${ticketCode || 'N/A'}</td></tr>
      </table>
    </div>
    <p style="font-size:14px;color:#555;margin:0 0 8px">Don't forget to bring your QR ticket for check-in. You can view it in your dashboard.</p>
  `;
  await sendMail({
    from: process.env.SMTP_FROM || `"Planning Center" <${process.env.SMTP_USER}>`,
    to,
    subject: `📅 Reminder: ${eventTitle} is coming up!`,
    html: notificationShell('Event Reminder', body),
  });
}

/**
 * Notify a user that a new event has just been published (sent after an
 * Admin/Supervisor approves an event — not on organizer creation, since a
 * pending event isn't visible/bookable yet).
 */
async function sendNewEventEmail(to, { eventTitle, eventDate, eventLocation, eventId }) {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${eventId}`;
  const body = `
    <div style="background:#f7f8fc;border-radius:10px;padding:20px;margin:0 0 20px">
      <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a1a2e">${eventTitle}</p>
      <table style="font-size:13px;color:#555;border-collapse:collapse">
        <tr><td style="padding:3px 12px 3px 0;color:#8888a0">Date</td><td style="padding:3px 0;font-weight:500">${eventDate}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#8888a0">Location</td><td style="padding:3px 0;font-weight:500">${eventLocation}</td></tr>
      </table>
    </div>
    <a href="${link}" style="display:inline-block;background:#F5A623;color:#fff;text-decoration:none;
              padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">View event &amp; register</a>
  `;
  await sendMail({
    from: process.env.SMTP_FROM || `"Planning Center" <${process.env.SMTP_USER}>`,
    to,
    subject: `🎉 New event: ${eventTitle}`,
    html: notificationShell('New Event Published', body),
  });
}

/**
 * Send a refund status update notification.
 */
async function sendRefundUpdateEmail(to, { eventName, ticketCode, status, reason }) {
  const statusColors = { pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444' };
  const color = statusColors[status] || '#8888a0';
  const body = `
    <div style="background:#f7f8fc;border-radius:10px;padding:20px;margin:0 0 16px;text-align:center">
      <div style="font-size:40px;margin-bottom:10px">
        ${status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳'}
      </div>
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${color};text-transform:uppercase">${status}</p>
      <p style="margin:0;font-size:13px;color:#8888a0">Refund for <strong>${eventName}</strong></p>
      ${reason ? `<p style="margin:8px 0 0;font-size:12px;color:#8888a0">Reason: ${reason}</p>` : ''}
      ${ticketCode ? `<p style="margin:4px 0 0;font-size:12px;color:#8888a0">Ticket: ${ticketCode}</p>` : ''}
    </div>
  `;
  await sendMail({
    from: process.env.SMTP_FROM || `"Planning Center" <${process.env.SMTP_USER}>`,
    to,
    subject: `Refund ${status}: ${eventName}`,
    html: notificationShell('Refund Update', body),
  });
}

/**
 * Send a promotional / marketing email.
 */
async function sendPromotionalEmail(to, { title, message, ctaText, ctaLink }) {
  const body = `
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px">${message}</p>
    ${ctaText && ctaLink ? `
      <a href="${ctaLink}" style="display:inline-block;background:linear-gradient(135deg,#F5A623,#FB6F4C);
         color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;
         font-size:14px;font-weight:600;margin:0 0 16px">${ctaText}</a>
    ` : ''}
  `;
  await sendMail({
    from: process.env.SMTP_FROM || `"Planning Center" <${process.env.SMTP_USER}>`,
    to,
    subject: title,
    html: notificationShell(title, body),
  });
}

/**
 * Send a test/diagnostic email to verify SMTP is working.
 */
async function sendTestEmail(to) {
  const body = `
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0">
      This is a test notification from Planning Center. If you received this email,
      your notification settings are working correctly!
    </p>
  `;
  await sendMail({
    from: process.env.SMTP_FROM || `"Planning Center" <${process.env.SMTP_USER}>`,
    to,
    subject: '✅ Test notification from Planning Center',
    html: notificationShell('Test Notification', body),
  });
}

/**
 * Send an event approval / rejection notification to the organizer.
 */
async function sendEventApprovalEmail(to, { eventTitle, status }) {
  const isApproved = status === "approved";
  const icon = isApproved ? "✅" : "❌";
  const color = isApproved ? "#10B981" : "#EF4444";
  const statusLabel = isApproved ? "APPROVED" : "REJECTED";
  const body = `
    <div style="background:#f7f8fc;border-radius:10px;padding:20px;margin:0 0 16px;text-align:center">
      <div style="font-size:40px;margin-bottom:10px">${icon}</div>
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${color};text-transform:uppercase">${statusLabel}</p>
      <p style="margin:0;font-size:14px;color:#555">
        Your event <strong>${eventTitle}</strong> has been ${status}.
      </p>
      ${isApproved ? `
        <p style="margin:12px 0 0;font-size:13px;color:#8888a0">
          The event is now live and visible to attendees on the platform.
        </p>
      ` : `
        <p style="margin:12px 0 0;font-size:13px;color:#8888a0">
          You may review the feedback and resubmit after making changes.
        </p>
      `}
    </div>
  `;
  await sendMail({
    from: process.env.SMTP_FROM || `"Planning Center" <${process.env.SMTP_USER}>`,
    to,
    subject: `${icon} Event ${statusLabel}: ${eventTitle}`,
    html: notificationShell(`Event ${statusLabel}`, body),
  });
}

module.exports = {
  sendOtpEmail, sendEventReminderEmail, sendNewEventEmail, sendRefundUpdateEmail,
  sendPromotionalEmail, sendTestEmail, sendEventApprovalEmail,
  isEmailConfigured, verifyEmailService, sendMail, transporter,
};
