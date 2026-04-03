const pool = require('../models/db');
const audit = require('../services/auditLog');
const { nextInquiryNumber } = require('../utils/sequenceGen');

async function listInquiries(req, res, next) {
  try {
    const { status, office_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (status) { params.push(status); conditions.push(`i.status = $${params.length}`); }
    if (office_id) { params.push(office_id); conditions.push(`i.office_id = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit, 10));
    params.push(offset);

    const result = await pool.query(
      `SELECT i.*, o.name AS office_name
       FROM inquiries i
       LEFT JOIN offices o ON o.id = i.office_id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countResult = await pool.query(`SELECT COUNT(*) FROM inquiries i ${where}`, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function getInquiry(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT i.*, o.name AS office_name FROM inquiries i
       LEFT JOIN offices o ON o.id = i.office_id WHERE i.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Inquiry not found.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createInquiry(req, res, next) {
  try {
    const { assigned_by, dsps_letter_reference, dsps_letter_date, subject, office_id, date_received } = req.body;
    const year = new Date().getFullYear();
    const inquiry_number = await nextInquiryNumber(year);

    const result = await pool.query(
      `INSERT INTO inquiries
         (inquiry_number, assigned_by, dsps_letter_reference, dsps_letter_date, subject, office_id, date_received)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [inquiry_number, assigned_by || 'DSPS Larkana', dsps_letter_reference, dsps_letter_date, subject, office_id || null, date_received]
    );

    await audit.log({ userId: req.user.id, action: 'INSERT', table: 'inquiries', recordId: result.rows[0].id, after: result.rows[0] });
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateInquiry(req, res, next) {
  try {
    const { id } = req.params;
    const before = await pool.query('SELECT * FROM inquiries WHERE id = $1', [id]);
    if (!before.rows[0]) return res.status(404).json({ success: false, error: 'Inquiry not found.' });

    const fields = ['assigned_by', 'dsps_letter_reference', 'dsps_letter_date', 'subject', 'office_id',
                    'date_received', 'visit_date', 'statements_recorded', 'report_submitted',
                    'report_submission_date', 'report_reference', 'status', 'notes'];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        params.push(req.body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    }

    if (!updates.length) return res.status(400).json({ success: false, error: 'No fields to update.' });
    params.push(id);

    const result = await pool.query(
      `UPDATE inquiries SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} RETURNING *`,
      params
    );

    await audit.log({ userId: req.user.id, action: 'UPDATE', table: 'inquiries', recordId: parseInt(id, 10), before: before.rows[0], after: result.rows[0] });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { listInquiries, getInquiry, createInquiry, updateInquiry };
