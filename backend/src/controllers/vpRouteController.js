const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listRoutes(req, res, next) {
  try {
    const { staff_id, is_active } = req.query;
    const params = [];
    const conditions = [];

    if (staff_id)   { params.push(parseInt(staff_id)); conditions.push(`r.staff_id=$${params.length}`); }
    if (is_active !== undefined && is_active !== '') {
      params.push(is_active === 'true');
      conditions.push(`r.is_active=$${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT r.*, s.full_name AS staff_name
       FROM vp_routes r
       JOIN staff s ON s.id = r.staff_id
       ${where}
       ORDER BY r.is_active DESC, r.effective_date DESC`,
      params
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

async function getRoute(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, s.full_name AS staff_name FROM vp_routes r JOIN staff s ON s.id=r.staff_id WHERE r.id=$1`, [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function createRoute(req, res, next) {
  try {
    const { staff_id, route_name, villages, frequency, source, effective_date, notes } = req.body;
    if (!staff_id || !route_name || !villages || !effective_date) {
      return res.status(400).json({ success: false, error: 'staff_id, route_name, villages, effective_date are required.' });
    }

    const result = await pool.query(
      `INSERT INTO vp_routes (staff_id, route_name, villages, frequency, source, effective_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [staff_id, route_name, villages, frequency||null, source||'Larkana GPO', effective_date, notes||null]
    );

    await audit.log({
      userId: req.user.id, action: 'INSERT', table: 'vp_routes',
      recordId: result.rows[0].id, after: result.rows[0]
    });

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateRoute(req, res, next) {
  try {
    const { id } = req.params;
    const before = (await pool.query('SELECT * FROM vp_routes WHERE id=$1', [id])).rows[0];
    if (!before) return res.status(404).json({ success: false, error: 'Not found.' });

    const { route_name, villages, frequency, source, effective_date, is_active, notes } = req.body;

    const result = await pool.query(
      `UPDATE vp_routes
       SET route_name=COALESCE($1,route_name), villages=COALESCE($2,villages),
           frequency=COALESCE($3,frequency), source=COALESCE($4,source),
           effective_date=COALESCE($5,effective_date),
           is_active=COALESCE($6,is_active), notes=COALESCE($7,notes),
           updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [route_name||null, villages||null, frequency||null, source||null,
       effective_date||null, is_active??null, notes||null, id]
    );

    await audit.log({
      userId: req.user.id, action: 'UPDATE', table: 'vp_routes',
      recordId: parseInt(id), before, after: result.rows[0]
    });

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

module.exports = { listRoutes, getRoute, createRoute, updateRoute };
