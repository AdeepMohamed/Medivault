const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createShareLink, getMyShareLinks, getShareLinkMeta,
  verifyOTP, resendOTP, getDoctorRecord, revokeShareLink,
} = require('../controllers/shareController');

const router = express.Router();

// Public routes (no auth needed)
router.get('/:token/meta', getShareLinkMeta);
router.post('/:token/verify', verifyOTP);
router.post('/:token/resend-otp', resendOTP);
router.get('/:token/record', getDoctorRecord);

// Protected routes
router.use(authenticate);
router.post('/', createShareLink);
router.get('/my/links', getMyShareLinks);
router.delete('/:id/revoke', revokeShareLink);

module.exports = router;
