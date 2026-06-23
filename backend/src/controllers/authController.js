const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { logAction } = require('../services/auditService');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role = 'patient' } = req.body;
    const allowedRoles = ['patient', 'doctor'];
    const assignedRole = allowedRoles.includes(role) ? role : 'patient';

    // Check existing user
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email.toLowerCase()).single();
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase.from('users').insert({
      name, email: email.toLowerCase(), password_hash: passwordHash, role: assignedRole,
    }).select('id, name, email, role, created_at').single();

    if (error) throw error;

    const { accessToken, refreshToken } = generateTokens(user.id);
    await supabase.from('users').update({ refresh_token: refreshToken }).eq('id', user.id);

    await logAction({ userId: user.id, action: 'REGISTER', resourceType: 'user', ipAddress: req.ip });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) { next(err); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users').select('*').eq('email', email.toLowerCase()).single();

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials.' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials.' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    await supabase.from('users').update({ refresh_token: refreshToken }).eq('id', user.id);

    await logAction({ userId: user.id, action: 'LOGIN', resourceType: 'user', ipAddress: req.ip });

    const { password_hash, refresh_token, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) { next(err); }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const { data: user } = await supabase
      .from('users').select('id, refresh_token').eq('id', decoded.userId).single();

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const tokens = generateTokens(user.id);
    await supabase.from('users').update({ refresh_token: tokens.refreshToken }).eq('id', user.id);

    res.json(tokens);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await supabase.from('users').update({ refresh_token: null }).eq('id', req.user.id);
      await logAction({ userId: req.user.id, action: 'LOGOUT', ipAddress: req.ip });
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) { next(err); }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PATCH /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const { name, phone, date_of_birth, blood_group, avatar_url } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({ name, phone, date_of_birth, blood_group, avatar_url, updated_at: new Date() })
      .eq('id', req.user.id)
      .select('id, name, email, role, phone, date_of_birth, blood_group, avatar_url, created_at')
      .single();

    if (error) throw error;
    res.json({ user });
  } catch (err) { next(err); }
};

// PATCH /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data: user } = await supabase
      .from('users').select('password_hash').eq('id', req.user.id).single();

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) return res.status(400).json({ error: 'Current password is incorrect.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password_hash: passwordHash }).eq('id', req.user.id);

    await logAction({ userId: req.user.id, action: 'CHANGE_PASSWORD', ipAddress: req.ip });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) { next(err); }
};

module.exports = { register, login, refresh, logout, getMe, updateMe, changePassword };
