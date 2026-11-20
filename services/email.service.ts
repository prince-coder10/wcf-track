import nodemailer from "nodemailer";

/**
 * Configure email transporter using SMTP settings from environment variables.
 * Fallbacks to Gmail or testing SMTP if configured.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback: If SMTP credentials not provided, log email content to console in development
  return null;
}

interface SendPasswordResetEmailParams {
  to: string;
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

/**
 * Sends the one-time 10-minute password reset link email.
 */
export async function sendPasswordResetEmail({
  to,
  fullName,
  resetUrl,
  expiresInMinutes,
}: SendPasswordResetEmailParams) {
  const from = process.env.EMAIL_FROM || "WCF Tracker <noreply@wcf-track.org>";
  const transporter = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #111827; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: bold; color: #111827; margin: 12px 0 4px; }
          .subtitle { font-size: 13px; color: #6b7280; }
          .content { font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 24px; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { background-color: #c83226; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; display: inline-block; font-size: 14px; box-shadow: 0 2px 4px rgba(200, 50, 38, 0.2); }
          .alert-box { background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 12px; color: #92400e; margin-bottom: 20px; }
          .footer { font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 16px; }
          .raw-link { word-break: break-all; color: #2563eb; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">Reset Your Password</h1>
            <p class="subtitle">Winners Campus Fellowship Evangelism &amp; Follow-up</p>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>We received a request to reset your password for your WCF Tracker account. Click the button below to choose a new password:</p>
            
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
            </div>

            <div class="alert-box">
              ⏱ <strong>Note:</strong> This link is single-use and will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not request this reset, you can safely ignore this email.
            </div>

            <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this URL into your browser:</p>
            <p><a href="${resetUrl}" class="raw-link">${resetUrl}</a></p>
          </div>
          <div class="footer">
            &copy; Winners Campus Fellowship &middot; Evangelism &amp; Follow-up System
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    return await transporter.sendMail({
      from,
      to,
      subject: "Reset your WCF Tracker password",
      text: `Hello ${fullName},\n\nYou requested a password reset for your WCF Tracker account.\n\nReset your password here (expires in ${expiresInMinutes} minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
      html: htmlContent,
    });
  } else {
    // If SMTP is not yet configured in .env, log details to server output
    console.log(`\n========================================================`);
    console.log(`[EMAIL DISPATCH] To: ${to}`);
    console.log(`[EMAIL DISPATCH] Subject: Reset your WCF Tracker password`);
    console.log(`[EMAIL DISPATCH] Reset Link (Expires in ${expiresInMinutes}m): ${resetUrl}`);
    console.log(`[EMAIL DISPATCH] Note: Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env to deliver live emails.`);
    console.log(`========================================================\n`);
    return { mock: true, delivered: false };
  }
}
