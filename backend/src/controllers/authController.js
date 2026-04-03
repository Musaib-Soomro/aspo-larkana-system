const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const audit = require('../services/auditLog');

const crossOrigin = process.env.COOKIE_SECURE === 'true';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: crossOrigin ? 'none' : 'strict',
  secure: crossOrigin,
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      'SELECT id, username, password_hash, full_name, role, office_id, is_active FROM users WHERE username = $1',
      [username]
    );
    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, officeId: user.office_id || null },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('aspo_token', token, COOKIE_OPTIONS);
    await audit.log({ userId: user.id, action: 'INSERT', table: 'auth_sessions', recordId: user.id, after: { event: 'login' } });

    return res.json({
      success: true,
      data: { id: user.id, username: user.username, full_name: user.full_name, role: user.role, office_id: user.office_id || null },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie('aspo_token', { httpOnly: true, sameSite: crossOrigin ? 'none' : 'strict', secure: crossOrigin });
  return res.json({ success: true, message: 'Logged out successfully.' });
}

async function me(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id, username, full_name, role, office_id FROM users WHERE id = $1 AND is_active = true',
      [req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(401).json({ success: false, error: 'User not found.' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;

    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];

    const match = await bcrypt.compare(current_password, user.password_hash);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, user.id]);

    await audit.log({ userId: user.id, action: 'UPDATE', table: 'users', recordId: user.id, after: { event: 'password_change' } });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, me, changePassword };
