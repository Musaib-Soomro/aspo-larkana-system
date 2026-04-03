const pool = require('../models/db');
const audit = require('../services/auditLog');
const { nextComplaintNumber } = require('../utils/sequenceGen');

async function listComplaints(req, res, next) {
  try {
    const { status, office_id, article_type, from_date, to_date, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (status) { params.push(status); conditions.push(`c.status = $${params.length}`); }
    if (office_id) { params.push(office_id); conditions.push(`c.office_id = $${params.length}`); }
    if (article_type) { params.push(article_type); conditions.push(`c.article_type = $${params.length}`); }
    if (from_date) { params.push(from_date); conditions.push(`c.date_received >= $${params.length}`); }
    if (to_date) { params.push(to_date); conditions.push(`c.date_received <= $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(c.complainant_name ILIKE $${params.length} OR c.complaint_number ILIKE $${params.length} OR c.article_number ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit, 10));
    params.push(offset);

    const result = await pool.query(
      `SELECT c.*, o.name AS office_name
       FROM complaints c
       LEFT JOIN offices o ON o.id = c.office_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countResult = await pool.query(`SELECT COUNT(*) FROM complaints c ${where}`, countParams);
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

async function getActiveComplaints(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT c.*, o.name AS office_name FROM complaints c
       LEFT JOIN offices o ON o.id = c.office_id
       WHERE c.status != 'Closed'
       ORDER BY c.created_at DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, o.name AS office_name FROM complaints c
       LEFT JOIN offices o ON o.id = c.office_id WHERE c.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Complaint not found.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createComplaint(req, res, next) {
  try {
    const { office_id, complainant_name, complainant_contact, article_number,
            article_type, date_received, source, complaint_description } = req.body;

    const year = new Date().getFullYear();
    const complaint_number = await nextComplaintNumber(year);

    const result = await pool.query(
      `INSERT INTO complaints
         (complaint_number, office_id, complainant_name, complainant_contact, article_number,
          article_type, date_received, source, complaint_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [complaint_number, office_id, complainant_name, complainant_contact, article_number,
       article_type, date_received, source, complaint_description]
    );

    await audit.log({ userId: req.user.id, action: 'INSERT', table: 'complaints', recordId: result.rows[0].id, after: result.rows[0] });
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const before = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (!before.rows[0]) return res.status(404).json({ success: false, error: 'Complaint not found.' });

    const fields = [
      'office_id', 'complainant_name', 'complainant_contact', 'article_number', 'article_type',
      'date_received', 'source', 'complaint_description', 'status', 'proof_of_delivery_notes',
      'proof_shared_date', 'memo_subject_code', 'memo_generated_date', 'memo_sent_to_dsps_date',
      'dsps_reply_received', 'dsps_reply_date', 'dsps_reply_notes', 'resolution_notes',
    ];
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
      `UPDATE complaints SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} RETURNING *`,
      params
    );

    await audit.log({ userId: req.user.id, action: 'UPDATE', table: 'complaints', recordId: parseInt(id, 10), before: before.rows[0], after: result.rows[0] });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { listComplaints, getActiveComplaints, getComplaint, createComplaint, updateComplaint };
