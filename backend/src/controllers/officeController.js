const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listOffices(req, res, next) {
  try {
    const { type, tehsil, shift, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = ['o.is_active = true'];

    if (type) { params.push(type); conditions.push(`o.type = $${params.length}`); }
    if (tehsil) { params.push(tehsil); conditions.push(`o.tehsil = $${params.length}`); }
    if (shift) { params.push(shift); conditions.push(`o.shift = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`(o.name ILIKE $${params.length} OR o.short_name ILIKE $${params.length})`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(parseInt(limit, 10));
    params.push(offset);

    const dataQuery = `
      SELECT o.*,
             COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true) AS staff_count
      FROM offices o
      LEFT JOIN staff s ON s.office_id = o.id
      ${where}
      GROUP BY o.id
      ORDER BY o.name
      LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const countParams = params.slice(0, params.length - 2);
    const countQuery = `SELECT COUNT(*) FROM offices o ${where}`;

    const [data, count] = await Promise.all([
      pool.query(dataQuery, params),
      pool.query(countQuery, countParams),
    ]);

    const total = parseInt(count.rows[0].count, 10);
    return res.json({
      success: true,
      data: data.rows,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function getOffice(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT o.*,
              COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true) AS staff_count,
              COUNT(DISTINCT c.id) FILTER (WHERE c.status != 'Closed') AS active_complaints
       FROM offices o
       LEFT JOIN staff s ON s.office_id = o.id
       LEFT JOIN complaints c ON c.office_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Office not found.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createOffice(req, res, next) {
  try {
    const { name, short_name, type, shift, has_edbos = false, tehsil, district = 'Larkana',
            account_office, bps_category, address, extra_fields = {} } = req.body;

    const result = await pool.query(
      `INSERT INTO offices (name, short_name, type, shift, has_edbos, tehsil, district,
                            account_office, bps_category, address, extra_fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [name, short_name, type, shift, has_edbos, tehsil, district,
       account_office, bps_category, address, JSON.stringify(extra_fields)]
    );

    await audit.log({ userId: req.user.id, action: 'INSERT', table: 'offices', recordId: result.rows[0].id, after: result.rows[0] });
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateOffice(req, res, next) {
  try {
    const { id } = req.params;
    const before = await pool.query('SELECT * FROM offices WHERE id = $1', [id]);
    if (!before.rows[0]) return res.status(404).json({ success: false, error: 'Office not found.' });

    const fields = ['name', 'short_name', 'type', 'shift', 'has_edbos', 'tehsil', 'district',
                    'account_office', 'bps_category', 'address', 'extra_fields'];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        params.push(field === 'extra_fields' ? JSON.stringify(req.body[field]) : req.body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    }

    if (!updates.length) return res.status(400).json({ success: false, error: 'No fields to update.' });

    params.push(id);
    const result = await pool.query(
      `UPDATE offices SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    );

    await audit.log({ userId: req.user.id, action: 'UPDATE', table: 'offices', recordId: parseInt(id, 10), before: before.rows[0], after: result.rows[0] });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deactivateOffice(req, res, next) {
  try {
    const { id } = req.params;
    const before = await pool.query('SELECT id, name FROM offices WHERE id = $1', [id]);
    if (!before.rows[0]) return res.status(404).json({ success: false, error: 'Office not found.' });

    await pool.query('DELETE FROM offices WHERE id = $1', [id]);
    await audit.log({ userId: req.user.id, action: 'DELETE', table: 'offices', recordId: parseInt(id, 10), before: before.rows[0], after: null });
    return res.json({ success: true, message: 'Office deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listOffices, getOffice, createOffice, updateOffice, deactivateOffice };
