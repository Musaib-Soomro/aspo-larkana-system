const pool = require('../models/db');
const audit = require('../services/auditLog');
const path = require('path');
const fs = require('fs');

/**
 * Upload a file and link it to an entity (leave, staff, etc.)
 */
async function uploadFile(req, res, next) {
  try {
    const { entity_type, entity_id } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, error: 'No file uploaded.' });
    if (!entity_type || !entity_id) {
      // If we don't have an entity yet, we just return the path for later linking
      // but usually we want to link it immediately or at least track it.
      return res.status(400).json({ success: false, error: 'Entity type and ID are required.' });
    }

    const { filename, mimetype, size, path: filePath } = file;
    const relativePath = path.relative(path.join(__dirname, '../../'), filePath);

    const result = await pool.query(
      `INSERT INTO attachments (entity_type, entity_id, file_name, file_path, file_type, size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [entity_type, entity_id, filename, relativePath, mimetype, size, req.user.id]
    );

    await audit.log({
      userId: req.user.id,
      action: 'INSERT',
      table: 'attachments',
      recordId: result.rows[0].id,
      after: result.rows[0]
    });

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * List attachments for a specific entity
 */
async function listAttachments(req, res, next) {
  try {
    const { entity_type, entity_id } = req.query;
    if (!entity_type || !entity_id) return res.status(400).json({ success: false, error: 'Missing params.' });

    const result = await pool.query(
      `SELECT a.*, u.full_name as uploaded_by_name 
       FROM attachments a
       LEFT JOIN users u ON u.id = a.uploaded_by
       WHERE a.entity_type = $1 AND a.entity_id = $2
       ORDER BY a.created_at DESC`,
      [entity_type, entity_id]
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete an attachment
 */
async function deleteAttachment(req, res, next) {
  try {
    const { id } = req.params;
    const before = (await pool.query('SELECT * FROM attachments WHERE id = $1', [id])).rows[0];
    if (!before) return res.status(404).json({ success: false, error: 'Not found.' });

    // Delete from disk
    const fullPath = path.join(__dirname, '../../', before.file_path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await pool.query('DELETE FROM attachments WHERE id = $1', [id]);

    await audit.log({
      userId: req.user.id,
      action: 'DELETE',
      table: 'attachments',
      recordId: parseInt(id),
      before
    });

    return res.json({ success: true, message: 'Deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFile, listAttachments, deleteAttachment };
