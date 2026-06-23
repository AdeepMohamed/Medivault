const supabase = require('../config/supabase');
const { generateOTP, generateToken, getOTPExpiry } = require('../services/otpService');
const { sendOTPEmail, sendShareLinkEmail } = require('../services/emailService');
const { logAction } = require('../services/auditService');
const QRCode = require('qrcode');

// POST /api/share
const createShareLink = async (req, res, next) => {
  try {
    const { recordId, doctorEmail, expiresInHours = 48, maxAccessCount = 10 } = req.body;

    // Verify record ownership
    const { data: record, error: recErr } = await supabase
      .from('records').select('id, title, owner_id').eq('id', recordId)
      .eq('owner_id', req.user.id).single();

    if (recErr || !record) return res.status(404).json({ error: 'Record not found.' });

    const token = generateToken();
    const otp = generateOTP(6);
    const otpExpiry = getOTPExpiry(10); // 10 min OTP
    const linkExpiry = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const { data: shareLink, error } = await supabase.from('share_links').insert({
      record_id: recordId,
      owner_id: req.user.id,
      token,
      otp,
      otp_expires_at: otpExpiry,
      doctor_email: doctorEmail || null,
      expires_at: linkExpiry,
      max_access_count: maxAccessCount,
    }).select().single();

    if (error) throw error;

    const shareUrl = `${process.env.FRONTEND_URL}/access/${token}`;

    // Generate QR Code
    let qrDataUrl = null;
    try {
      qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 300, margin: 2,
        color: { dark: '#0d9488', light: '#0f172a' },
      });
    } catch (qrErr) { console.error('QR generation error:', qrErr.message); }

    // Send email if doctor email provided
    if (doctorEmail && process.env.EMAIL_USER) {
      try {
        // First send the share link email
        await sendShareLinkEmail({
          to: doctorEmail,
          shareUrl,
          qrDataUrl,
          recordTitle: record.title,
          patientName: req.user.name,
          expiresAt: linkExpiry,
        });

        // Then send OTP email
        await sendOTPEmail({
          to: doctorEmail,
          otp,
          recordTitle: record.title,
          patientName: req.user.name,
        });
      } catch (emailErr) {
        console.error('Email send error:', emailErr.message);
        // Don't fail the request if email fails
      }
    }

    await logAction({
      userId: req.user.id, action: 'CREATE_SHARE_LINK',
      resourceId: record.id, resourceType: 'record',
      details: { doctorEmail, expiresInHours, token: token.substring(0, 8) + '...' },
      ipAddress: req.ip,
    });

    res.status(201).json({
      shareLink: { ...shareLink, otp: undefined }, // Don't expose OTP in response
      shareUrl,
      qrDataUrl,
      // Return OTP in dev mode only
      ...(process.env.NODE_ENV !== 'production' && { _devOtp: otp }),
    });
  } catch (err) { next(err); }
};

// GET /api/share/my-links
const getMyShareLinks = async (req, res, next) => {
  try {
    const { data: links, error } = await supabase
      .from('share_links')
      .select(`*, records(title, category, record_date)`)
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ links });
  } catch (err) { next(err); }
};

// GET /api/share/:token — Public: get share link metadata
const getShareLinkMeta = async (req, res, next) => {
  try {
    const { token } = req.params;

    const { data: link, error } = await supabase
      .from('share_links')
      .select(`*, records(title, category, record_date, description)`)
      .eq('token', token)
      .single();

    if (error || !link) return res.status(404).json({ error: 'Share link not found.' });
    if (link.is_revoked) return res.status(410).json({ error: 'This link has been revoked.' });
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This link has expired.' });
    }
    if (link.access_count >= link.max_access_count) {
      return res.status(410).json({ error: 'Maximum access limit reached.' });
    }

    res.json({
      recordTitle: link.records?.title,
      recordCategory: link.records?.category,
      recordDate: link.records?.record_date,
      expiresAt: link.expires_at,
      doctorEmail: link.doctor_email,
    });
  } catch (err) { next(err); }
};

// POST /api/share/:token/verify — Public: verify OTP
const verifyOTP = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { otp, doctorEmail } = req.body;

    const { data: link, error } = await supabase
      .from('share_links').select('*').eq('token', token).single();

    if (error || !link) return res.status(404).json({ error: 'Share link not found.' });
    if (link.is_revoked) return res.status(410).json({ error: 'Link has been revoked.' });
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Link has expired.' });
    }
    if (new Date(link.otp_expires_at) < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (link.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // Update access count and log
    await supabase.from('share_links')
      .update({ access_count: link.access_count + 1 })
      .eq('id', link.id);

    await supabase.from('share_accesses').insert({
      share_link_id: link.id,
      doctor_email: doctorEmail || 'anonymous',
    });

    await logAction({
      action: 'DOCTOR_ACCESS',
      resourceId: link.record_id,
      resourceType: 'record',
      details: { doctorEmail, token: token.substring(0, 8) + '...' },
      ipAddress: req.ip,
    });

    // Generate a short-lived access JWT for viewing the record
    const jwt = require('jsonwebtoken');
    const viewToken = jwt.sign(
      { recordId: link.record_id, doctorEmail, type: 'doctor-view' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    res.json({ viewToken, recordId: link.record_id });
  } catch (err) { next(err); }
};

// POST /api/share/:token/resend-otp — Resend OTP
const resendOTP = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { doctorEmail } = req.body;

    const { data: link, error } = await supabase
      .from('share_links')
      .select(`*, records(title), users!share_links_owner_id_fkey(name)`)
      .eq('token', token).single();

    if (error || !link) return res.status(404).json({ error: 'Share link not found.' });

    const newOtp = generateOTP(6);
    const newExpiry = getOTPExpiry(10);

    await supabase.from('share_links').update({ otp: newOtp, otp_expires_at: newExpiry }).eq('id', link.id);

    if (doctorEmail && process.env.EMAIL_USER) {
      await sendOTPEmail({
        to: doctorEmail,
        otp: newOtp,
        recordTitle: link.records?.title || 'Medical Record',
        patientName: link.users?.name || 'Patient',
      });
    }

    res.json({ message: 'OTP resent.', ...(process.env.NODE_ENV !== 'production' && { _devOtp: newOtp }) });
  } catch (err) { next(err); }
};

// GET /api/share/:token/record — Doctor views record (needs viewToken header)
const getDoctorRecord = async (req, res, next) => {
  try {
    const { token } = req.params;
    const viewTokenHeader = req.headers['x-view-token'];
    if (!viewTokenHeader) return res.status(401).json({ error: 'View token required.' });

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(viewTokenHeader, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired view token.' });
    }

    if (decoded.type !== 'doctor-view') return res.status(401).json({ error: 'Invalid token type.' });

    // Verify token matches
    const { data: link } = await supabase
      .from('share_links').select('record_id').eq('token', token).single();

    if (!link || link.record_id !== decoded.recordId) {
      return res.status(403).json({ error: 'Token mismatch.' });
    }

    const { data: record, error } = await supabase
      .from('records').select('*').eq('id', decoded.recordId).single();

    if (error || !record) return res.status(404).json({ error: 'Record not found.' });

    // Get AI summary
    const { data: aiSummary } = await supabase
      .from('ai_summaries').select('*').eq('record_id', record.id).single();

    res.json({ record, aiSummary });
  } catch (err) { next(err); }
};

// DELETE /api/share/:id/revoke
const revokeShareLink = async (req, res, next) => {
  try {
    const { data: link } = await supabase
      .from('share_links').select('id, owner_id').eq('id', req.params.id).single();

    if (!link || link.owner_id !== req.user.id) {
      return res.status(404).json({ error: 'Share link not found.' });
    }

    await supabase.from('share_links').update({ is_revoked: true }).eq('id', link.id);

    await logAction({
      userId: req.user.id, action: 'REVOKE_SHARE_LINK',
      resourceId: link.id, resourceType: 'shareLink', ipAddress: req.ip,
    });

    res.json({ message: 'Share link revoked.' });
  } catch (err) { next(err); }
};

module.exports = { createShareLink, getMyShareLinks, getShareLinkMeta, verifyOTP, resendOTP, getDoctorRecord, revokeShareLink };
