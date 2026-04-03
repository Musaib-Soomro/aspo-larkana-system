const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listStaff(req, res, next) {
  try {
    const { office_id, designation, is_active = 'true', search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (is_active !== 'all') {
      params.push(is_active === 'true');
      conditions.push(`s.is_active = $${params.length}`);
    }
    if (office_id) { params.push(office_id); conditions.push(`s.office_id = $${params.length}`); }
    if (designation) { params.push(designation); conditions.push(`s.designation = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`s.full_name ILIKE $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(parseInt(limit, 10));
    params.push(offset);

    const result = await pool.query(
      `SELECT s.*, o.name AS office_name,
              lo.name AS lookafter_office_name
       FROM staff s
       JOIN offices o ON o.id = s.office_id
       LEFT JOIN offices lo ON lo.id = s.lookafter_office_id
       ${where}
       ORDER BY o.name, s.full_name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countResult = await pool.query(`SELECT COUNT(*) FROM staff s ${where}`, countParams);
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

async function getStaffOnLeave(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT s.id, s.full_name, s.designation, o.name AS office_name,
              lr.leave_type, lr.start_date, lr.end_date, lr.total_days
       FROM staff s
       JOIN offices o ON o.id = s.office_id
       JOIN leave_records lr ON lr.staff_id = s.id
       WHERE s.is_on_leave = true AND lr.status = 'Active'
       ORDER BY lr.start_date DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getStaffOnLookafter(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT s.id, s.full_name, s.designation,
              o.name AS home_office_name,
              lo.name AS lookafter_office_name
       FROM staff s
       JOIN offices o ON o.id = s.office_id
       JOIN offices lo ON lo.id = s.lookafter_office_id
       WHERE s.is_on_lookafter = true AND s.is_active = true
       ORDER BY o.name`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getStaff(req, res, next) {
  try {
    const { id } = req.params;
    const [staffResult, leaveResult] = await Promise.all([
      pool.query(
        `SELECT s.*, o.name AS office_name, lo.name AS lookafter_office_name
         FROM staff s
         JOIN offices o ON o.id = s.office_id
         LEFT JOIN offices lo ON lo.id = s.lookafter_office_id
         WHERE s.id = $1`,
        [id]
      ),
      pool.query(
        `SELECT lr.*, ltc.annual_limit
         FROM leave_records lr
         LEFT JOIN leave_type_config ltc ON ltc.type_name = lr.leave_type
         WHERE lr.staff_id = $1
         ORDER BY lr.created_at DESC
         LIMIT 20`,
        [id]
      ),
    ]);

    if (!staffResult.rows[0]) return res.status(404).json({ success: false, error: 'Staff member not found.' });

    // CL balance for current year
    const currentYear = new Date().getFullYear();
    const clResult = await pool.query(
      `SELECT COALESCE(SUM(total_days), 0) AS used
       FROM leave_records
       WHERE staff_id = $1
         AND leave_type = 'Casual Leave'
         AND EXTRACT(YEAR FROM start_date) = $2
         AND status != 'Cancelled'`,
      [id, currentYear]
    );
    const clUsed = parseInt(clResult.rows[0].used, 10);

    return res.json({
      success: true,
      data: {
        ...staffResult.rows[0],
        recent_leaves: leaveResult.rows,
        cl_balance: { year: currentYear, used: clUsed, remaining: Math.max(0, 20 - clUsed) },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function createStaff(req, res, next) {
  try {
    const { office_id, full_name, designation, bps, employee_id, date_of_joining, current_posting_date, date_of_birth } = req.body;
    const result = await pool.query(
      `INSERT INTO staff (office_id, full_name, designation, bps, employee_id, date_of_joining, current_posting_date, date_of_birth)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [office_id, full_name, designation, bps, employee_id, date_of_joining, current_posting_date || null, date_of_birth || null]
    );
    await audit.log({ userId: req.user.id, action: 'INSERT', table: 'staff', recordId: result.rows[0].id, after: result.rows[0] });
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateStaff(req, res, next) {
  try {
    const { id } = req.params;
    const before = await pool.query('SELECT * FROM staff WHERE id = $1', [id]);
    if (!before.rows[0]) return res.status(404).json({ success: false, error: 'Staff member not found.' });

    const fields = ['office_id', 'full_name', 'designation', 'bps', 'employee_id',
                    'date_of_joining', 'current_posting_date', 'date_of_birth',
                    'is_active', 'is_on_leave', 'is_on_lookafter', 'lookafter_office_id'];
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
      `UPDATE staff SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    );
    await audit.log({ userId: req.user.id, action: 'UPDATE', table: 'staff', recordId: parseInt(id, 10), before: before.rows[0], after: result.rows[0] });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deactivateStaff(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE staff SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, full_name',
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Staff member not found.' });
    await audit.log({ userId: req.user.id, action: 'DELETE', table: 'staff', recordId: parseInt(id, 10), after: { soft_deleted: true } });
    return res.json({ success: true, message: 'Staff member deactivated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listStaff, getStaffOnLeave, getStaffOnLookafter, getStaff, createStaff, updateStaff, deactivateStaff };
