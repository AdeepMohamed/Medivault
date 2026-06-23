const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send OTP email to doctor
 */
const sendOTPEmail = async ({ to, otp, recordTitle, patientName, expiresIn = 10 }) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0d9488, #0891b2); padding: 32px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 700; }
        .header p { margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
        .body { padding: 32px; }
        .otp-box { background: #0f172a; border: 2px solid #0d9488; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #14b8a6; font-family: monospace; }
        .info { background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; color: #94a3b8; }
        .info strong { color: #e2e8f0; }
        .warning { color: #f59e0b; font-size: 13px; margin-top: 16px; }
        .footer { padding: 16px 32px; text-align: center; font-size: 12px; color: #475569; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 MediVault</h1>
          <p>Secure Medical Record Access</p>
        </div>
        <div class="body">
          <p>Hello,</p>
          <p><strong>${patientName}</strong> has shared a medical record with you on MediVault. Use the OTP below to access it securely.</p>
          
          <div class="info">
            <strong>Record:</strong> ${recordTitle}
          </div>
          
          <div class="otp-box">
            <div style="font-size:13px;color:#94a3b8;margin-bottom:8px;">Your One-Time Password</div>
            <div class="otp-code">${otp}</div>
          </div>
          
          <p class="warning">⏱ This OTP expires in <strong>${expiresIn} minutes</strong>. Do not share this code with anyone.</p>
          <p style="font-size:13px;color:#64748b;">If you did not expect this email, you can safely ignore it.</p>
        </div>
        <div class="footer">
          MediVault — Your Personal Medical Record Locker<br/>
          This is an automated message. Do not reply.
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"MediVault" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your MediVault Access OTP: ${otp}`,
    html,
  });
};

/**
 * Send share link email with QR code
 */
const sendShareLinkEmail = async ({ to, shareUrl, qrDataUrl, recordTitle, patientName, expiresAt }) => {
  const transporter = createTransporter();

  const expiryStr = expiresAt ? new Date(expiresAt).toLocaleString() : 'No expiry';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0d9488, #0891b2); padding: 32px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 700; }
        .body { padding: 32px; }
        .link-box { background: #0f172a; border: 1px solid #0d9488; border-radius: 8px; padding: 16px; word-break: break-all; font-size: 13px; color: #14b8a6; margin: 16px 0; }
        .btn { display: inline-block; background: #0d9488; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 8px 0; }
        .footer { padding: 16px 32px; text-align: center; font-size: 12px; color: #475569; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 MediVault</h1>
          <p>Secure Medical Record Shared With You</p>
        </div>
        <div class="body">
          <p><strong>${patientName}</strong> has shared <strong>${recordTitle}</strong> with you.</p>
          <p>Click the link below or scan the QR code to access the record. An OTP will be sent to your email for verification.</p>
          
          <a href="${shareUrl}" class="btn">Access Record →</a>
          
          <div class="link-box">${shareUrl}</div>
          
          ${qrDataUrl ? `<div style="text-align:center;margin:16px 0"><img src="${qrDataUrl}" alt="QR Code" style="width:160px;height:160px;border-radius:8px;" /></div>` : ''}
          
          <p style="font-size:13px;color:#64748b;">Link expires: ${expiryStr}</p>
        </div>
        <div class="footer">MediVault — Your Personal Medical Record Locker</div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"MediVault" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${patientName} shared a medical record with you`,
    html,
  });
};

module.exports = { sendOTPEmail, sendShareLinkEmail };
