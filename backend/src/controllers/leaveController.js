const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listLeave(req, res, next) {
  try {
    const { staff_id, leave_type, year, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (staff_id) { params.push(staff_id); conditions.push(`lr.staff_id = $${params.length}`); }
    if (leave_type) { params.push(leave_type); conditions.push(`lr.leave_type = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`lr.status = $${params.length}`); }
    if (year) { params.push(year); conditions.push(`EXTRACT(YEAR FROM lr.start_date) = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit, 10));
    params.push(offset);

    const result = await pool.query(
      `SELECT lr.*, s.full_name AS staff_name, s.designation,
              o.name AS office_name,
              sub.full_name AS substitute_name
       FROM leave_records lr
       JOIN staff s ON s.id = lr.staff_id
       JOIN offices o ON o.id = s.office_id
       LEFT JOIN staff sub ON sub.id = lr.substitute_staff_id
       ${where}
       ORDER BY lr.start_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countResult = await pool.query(`SELECT COUNT(*) FROM leave_records lr ${where}`, countParams);
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

async function getLeaveBalance(req, res, next) {
  try {
    const { staff_id } = req.params;
    const year = req.query.year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT lr.leave_type, COALESCE(SUM(lr.total_days), 0) AS days_used,
              ltc.annual_limit
       FROM leave_records lr
       LEFT JOIN leave_type_config ltc ON ltc.type_name = lr.leave_type
       WHERE lr.staff_id = $1
         AND EXTRACT(YEAR FROM lr.start_date) = $2
         AND lr.status != 'Cancelled'
       GROUP BY lr.leave_type, ltc.annual_limit`,
      [staff_id, year]
    );

    const balance = {};
    for (const row of result.rows) {
      const used = parseInt(row.days_used, 10);
      balance[row.leave_type] = {
        used,
        annual_limit: row.annual_limit,
        remaining: row.annual_limit !== null ? Math.max(0, row.annual_limit - used) : null,
      };
    }

    return res.json({ success: true, data: balance });
  } catch (err) {
    next(err);
  }
}

async function createLeave(req, res, next) {
  try {
    const { staff_id, leave_type, start_date, end_date, reason, substitute_staff_id, notes } = req.body;

    const start = new Date(start_date);
    const end = new Date(end_date);
    const total_days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (total_days < 1) {
      return res.status(400).json({ success: false, error: 'End date must be on or after start date.' });
    }

    // Check CL balance if Casual Leave
    if (leave_type === 'Casual Leave') {
      const year = start.getFullYear();
      const usedResult = await pool.query(
        `SELECT COALESCE(SUM(total_days), 0) AS used FROM leave_records
         WHERE staff_id = $1 AND leave_type = 'Casual Leave'
           AND EXTRACT(YEAR FROM start_date) = $2 AND status != 'Cancelled'`,
        [staff_id, year]
      );
      const used = parseInt(usedResult.rows[0].used, 10);
      if (used + total_days > 20) {
        return res.status(400).json({
          success: false,
          error: `Insufficient Casual Leave balance. Used: ${used}/20, Requesting: ${total_days} days.`,
        });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO leave_records
           (staff_id, leave_type, start_date, end_date, total_days, reason, substitute_staff_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [staff_id, leave_type, start_date, end_date, total_days, reason, substitute_staff_id || null, notes]
      );
      await client.query('UPDATE staff SET is_on_leave = true, updated_at = NOW() WHERE id = $1', [staff_id]);
      await client.query('COMMIT');

      await audit.log({ userId: req.user.id, action: 'INSERT', table: 'leave_records', recordId: result.rows[0].id, after: result.rows[0] });
      return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

async function updateLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const before = await pool.query('SELECT * FROM leave_records WHERE id = $1', [id]);
    if (!before.rows[0]) return res.status(404).json({ success: false, error: 'Leave record not found.' });

    const result = await pool.query(
      `UPDATE leave_records SET status = COALESCE($1, status), notes = COALESCE($2, notes)
       WHERE id = $3 RETURNING *`,
      [status, notes, id]
    );

    // If leave completed or cancelled, set staff.is_on_leave = false
    if (status === 'Completed' || status === 'Cancelled') {
      await pool.query('UPDATE staff SET is_on_leave = false, updated_at = NOW() WHERE id = $1', [before.rows[0].staff_id]);
    }

    await audit.log({ userId: req.user.id, action: 'UPDATE', table: 'leave_records', recordId: parseInt(id, 10), before: before.rows[0], after: result.rows[0] });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function listLeaveTypes(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM leave_type_config ORDER BY id');
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createLeaveType(req, res, next) {
  try {
    const { type_name, annual_limit } = req.body;
    const result = await pool.query(
      'INSERT INTO leave_type_config (type_name, annual_limit) VALUES ($1, $2) RETURNING *',
      [type_name, annual_limit || null]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateLeaveType(req, res, next) {
  try {
    const { id } = req.params;
    const { annual_limit, is_active } = req.body;
    const result = await pool.query(
      `UPDATE leave_type_config
       SET annual_limit = COALESCE($1, annual_limit),
           is_active = COALESCE($2, is_active)
       WHERE id = $3 RETURNING *`,
      [annual_limit !== undefined ? annual_limit : null, is_active, id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Leave type not found.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function getAllLeaveBalances(req, res, next) {
  try {
    const year = req.query.year || new Date().getFullYear();

    // Get all active staff with their office
    const staffResult = await pool.query(
      `SELECT s.id, s.full_name, s.designation, s.employee_id, o.name AS office_name
       FROM staff s
       JOIN offices o ON o.id = s.office_id
       WHERE s.is_active = true
       ORDER BY o.name, s.full_name`
    );

    if (!staffResult.rows.length) return res.json({ success: true, data: [] });

    // Get leave usage for all staff in bulk for the year
    const usageResult = await pool.query(
      `SELECT lr.staff_id, lr.leave_type, COALESCE(SUM(lr.total_days), 0) AS days_used,
              ltc.annual_limit
       FROM leave_records lr
       LEFT JOIN leave_type_config ltc ON ltc.type_name = lr.leave_type
       WHERE lr.staff_id = ANY($1)
         AND EXTRACT(YEAR FROM lr.start_date) = $2
         AND lr.status != 'Cancelled'
       GROUP BY lr.staff_id, lr.leave_type, ltc.annual_limit`,
      [staffResult.rows.map((s) => s.id), year]
    );

    // Index usage by staff_id
    const usageMap = {};
    for (const row of usageResult.rows) {
      if (!usageMap[row.staff_id]) usageMap[row.staff_id] = {};
      usageMap[row.staff_id][row.leave_type] = {
        used: parseInt(row.days_used, 10),
        annual_limit: row.annual_limit,
        remaining: row.annual_limit !== null ? Math.max(0, row.annual_limit - parseInt(row.days_used, 10)) : null,
      };
    }

    const data = staffResult.rows.map((s) => ({
      ...s,
      leave_balance: usageMap[s.id] || {},
    }));

    return res.json({ success: true, data, year: parseInt(year, 10) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listLeave, getLeaveBalance, getAllLeaveBalances, createLeave, updateLeave, listLeaveTypes, createLeaveType, updateLeaveType };
