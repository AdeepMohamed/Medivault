const crypto = require('crypto');

/**
 * Generate a numeric OTP
 * @param {number} length
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Generate a cryptographically secure share token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get OTP expiry time (default: 10 minutes from now)
 * @param {number} minutes
 */
const getOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = { generateOTP, generateToken, getOTPExpiry };
