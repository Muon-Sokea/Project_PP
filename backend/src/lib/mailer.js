const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

  await transporter.sendMail({
    from:    process.env.SMTP_FROM || `"Planning Center" <${process.env.SMTP_USER}>`,
    to,
    subject: `${otp} is your Planning Center code`,
    html,
  });
}

module.exports = { sendOtpEmail };
