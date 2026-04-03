const pool = require('../models/db');

async function getSettings(req, res, next) {
  try {
    const result = await pool.query('SELECT key, value FROM settings ORDER BY key');
    const settings = {};
    for (const row of result.rows) settings[row.key] = row.value;
    return res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const updates = req.body;
    if (typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({ success: false, error: 'Body must be a key-value object.' });
    }

    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value)]
      );
    }

    return res.json({ success: true, message: 'Settings updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings };
