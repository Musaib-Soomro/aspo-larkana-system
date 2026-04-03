const bcrypt = require('bcrypt');
const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listUsers(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.role, u.office_id, u.is_active, u.created_at,
              o.name AS office_name
       FROM users u
       LEFT JOIN offices o ON o.id = u.office_id
       ORDER BY u.role, u.full_name`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { username, password, full_name, role, office_id } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ success: false, error: 'username, password, full_name, and role are required.' });
    }
    if (role === 'postmaster' && !office_id) {
      return res.status(400).json({ success: false, error: 'office_id is required for postmaster role.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length) {
      return res.status(409).json({ success: false, error: 'Username already exists.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role, office_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, full_name, role, office_id, is_active, created_at`,
      [username, hash, full_name, role, office_id || null]
    );

    await audit.log({ userId: req.user.id, action: 'INSERT', table: 'users', recordId: result.rows[0].id, after: { username, role, office_id } });
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active, full_name, office_id, password } = req.body;

    const fields = [];
    const params = [];

    if (full_name !== undefined) { params.push(full_name); fields.push(`full_name = $${params.length}`); }
    if (office_id !== undefined) { params.push(office_id); fields.push(`office_id = $${params.length}`); }
    if (is_active !== undefined) { params.push(is_active); fields.push(`is_active = $${params.length}`); }
    if (password) {
      if (password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
      const hash = await bcrypt.hash(password, 12);
      params.push(hash);
      fields.push(`password_hash = $${params.length}`);
    }

    if (!fields.length) return res.status(400).json({ success: false, error: 'No fields to update.' });

    params.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}
       RETURNING id, username, full_name, role, office_id, is_active`,
      params
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'User not found.' });

    await audit.log({ userId: req.user.id, action: 'UPDATE', table: 'users', recordId: parseInt(id, 10), after: result.rows[0] });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser, updateUser };
