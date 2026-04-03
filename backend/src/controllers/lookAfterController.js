const pool = require('../models/db');
const audit = require('../services/auditLog');

const SELECT_COLS = `
  la.id, la.staff_id, la.office_id, la.lookafter_designation,
  la.dsps_order_no, la.dsps_order_date,
  la.start_date, la.start_reason,
  la.end_date, la.end_reason,
  la.is_active, la.created_at, la.updated_at,
  s.full_name AS staff_name,
  s.designation AS staff_designation,
  so.name AS home_office_name,
  lo.name AS lookafter_office_name
`;

const BASE_FROM = `
  FROM lookafter_assignments la
  JOIN staff s ON s.id = la.staff_id
  JOIN offices so ON so.id = s.office_id
  JOIN offices lo ON lo.id = la.office_id
`;

async function listLookAfters(req, res, next) {
  try {
    const { page = 1, limit = 20, is_active, office_id, lookafter_designation, search, staff_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (is_active !== undefined && is_active !== '') {
      params.push(is_active === 'true');
      conditions.push(`la.is_active = $${params.length}`);
    }
    if (office_id) { params.push(parseInt(office_id)); conditions.push(`la.office_id = $${params.length}`); }
    if (lookafter_designation) { params.push(lookafter_designation); conditions.push(`la.lookafter_designation = $${params.length}`); }
    if (staff_id) { params.push(parseInt(staff_id)); conditions.push(`la.staff_id = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`s.full_name ILIKE $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countParams = [...params];
    params.push(parseInt(limit));
    params.push(offset);

    const result = await pool.query(
      `SELECT ${SELECT_COLS} ${BASE_FROM} ${where}
       ORDER BY la.is_active DESC, la.start_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM lookafter_assignments la JOIN staff s ON s.id = la.staff_id ${where}`,
      countParams
    );
    const total = parseInt(count.rows[0].count);

    return res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
}

async function getLookAfter(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ${SELECT_COLS} ${BASE_FROM} WHERE la.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function createLookAfter(req, res, next) {
  try {
    const { staff_id, office_id, lookafter_designation, dsps_order_no, dsps_order_date, start_date, start_reason } = req.body;

    // Guard 1: staff already has an active look-after
    const staffRow = (await pool.query('SELECT is_on_lookafter FROM staff WHERE id=$1 AND is_active=true', [staff_id])).rows[0];
    if (!staffRow) return res.status(404).json({ success: false, error: 'Staff member not found.' });
    if (staffRow.is_on_lookafter) {
      return res.status(400).json({ success: false, error: 'This staff member already has an active look-after assignment.' });
    }

    // Guard 2: post must be vacant — no active staff with that designation at that office without an active transfer
    const occupiedCheck = await pool.query(
      `SELECT s.id FROM staff s
       WHERE s.office_id = $1
         AND s.designation = $2
         AND s.is_active = true
         AND NOT EXISTS (
           SELECT 1 FROM transfer_records tr
           WHERE tr.staff_id = s.id
             AND tr.status IN ('Ordered','Relieved')
         )`,
      [office_id, lookafter_designation]
    );
    if (occupiedCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'This post is not vacant. An active staff member holds that designation at the selected office.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO lookafter_assignments
           (staff_id, office_id, lookafter_designation, dsps_order_no, dsps_order_date, start_date, start_reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [staff_id, office_id, lookafter_designation, dsps_order_no, dsps_order_date, start_date, start_reason]
      );

      await client.query(
        `UPDATE staff SET is_on_lookafter=true, lookafter_office_id=$1, updated_at=NOW() WHERE id=$2`,
        [office_id, staff_id]
      );

      await client.query('COMMIT');

      await audit.log({
        userId: req.user.id, action: 'INSERT', table: 'lookafter_assignments',
        recordId: result.rows[0].id, after: result.rows[0]
      });

      return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally { client.release(); }
  } catch (err) { next(err); }
}

async function endLookAfter(req, res, next) {
  try {
    const { id } = req.params;
    const { end_date, end_reason } = req.body;

    const before = (await pool.query('SELECT * FROM lookafter_assignments WHERE id=$1', [id])).rows[0];
    if (!before) return res.status(404).json({ success: false, error: 'Not found.' });
    if (!before.is_active) return res.status(400).json({ success: false, error: 'This assignment is already ended.' });
    if (!end_date || !end_reason) return res.status(400).json({ success: false, error: 'End date and reason are required.' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE lookafter_assignments
         SET is_active=false, end_date=$1, end_reason=$2, updated_at=NOW()
         WHERE id=$3 RETURNING *`,
        [end_date, end_reason, id]
      );

      await client.query(
        `UPDATE staff SET is_on_lookafter=false, lookafter_office_id=NULL, updated_at=NOW() WHERE id=$1`,
        [before.staff_id]
      );

      await client.query('COMMIT');

      await audit.log({
        userId: req.user.id, action: 'UPDATE', table: 'lookafter_assignments',
        recordId: parseInt(id), before, after: result.rows[0]
      });

      return res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally { client.release(); }
  } catch (err) { next(err); }
}

module.exports = { listLookAfters, getLookAfter, createLookAfter, endLookAfter };
