const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listDeliveryLogs(req, res, next) {
  try {
    const { page = 1, limit = 20, staff_id, month, year } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (staff_id) { params.push(parseInt(staff_id)); conditions.push(`l.staff_id=$${params.length}`); }
    if (month)    { params.push(parseInt(month));    conditions.push(`EXTRACT(MONTH FROM l.date)=$${params.length}`); }
    if (year)     { params.push(parseInt(year));     conditions.push(`EXTRACT(YEAR FROM l.date)=$${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countParams = [...params];
    params.push(parseInt(limit)); params.push(offset);

    const result = await pool.query(
      `SELECT l.*, s.full_name AS staff_name, r.route_name
       FROM vp_delivery_logs l
       JOIN staff s ON s.id = l.staff_id
       LEFT JOIN vp_routes r ON r.id = l.route_id
       ${where}
       ORDER BY l.date DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM vp_delivery_logs l ${where}`, countParams
    );
    const total = parseInt(count.rows[0].count);

    return res.json({
      success: true, data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
}

async function getMonthlyDelivery(req, res, next) {
  try {
    const { staff_id, month, year } = req.query;
    if (!staff_id || !month || !year) {
      return res.status(400).json({ success: false, error: 'staff_id, month, year are required.' });
    }

    const result = await pool.query(
      `SELECT
         SUM(articles_received)    AS total_received,
         SUM(articles_delivered)   AS total_delivered,
         SUM(articles_undelivered) AS total_undelivered,
         COUNT(*)                  AS days_logged
       FROM vp_delivery_logs
       WHERE staff_id=$1
         AND EXTRACT(MONTH FROM date)=$2
         AND EXTRACT(YEAR FROM date)=$3`,
      [parseInt(staff_id), parseInt(month), parseInt(year)]
    );

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function createLog(req, res, next) {
  try {
    const { staff_id, route_id, date, articles_received, articles_delivered, undelivered_reason, notes } = req.body;
    if (!staff_id || !date || articles_received === undefined || articles_delivered === undefined) {
      return res.status(400).json({ success: false, error: 'staff_id, date, articles_received, articles_delivered are required.' });
    }

    const received   = parseInt(articles_received);
    const delivered  = parseInt(articles_delivered);
    const undelivered = received - delivered;

    if (undelivered < 0) {
      return res.status(400).json({ success: false, error: 'articles_delivered cannot exceed articles_received.' });
    }

    const result = await pool.query(
      `INSERT INTO vp_delivery_logs (staff_id, route_id, date, articles_received, articles_delivered, articles_undelivered, undelivered_reason, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [staff_id, route_id||null, date, received, delivered, undelivered, undelivered_reason||null, notes||null]
    );

    await audit.log({
      userId: req.user.id, action: 'INSERT', table: 'vp_delivery_logs',
      recordId: result.rows[0].id, after: result.rows[0]
    });

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateLog(req, res, next) {
  try {
    const { id } = req.params;
    const before = (await pool.query('SELECT * FROM vp_delivery_logs WHERE id=$1', [id])).rows[0];
    if (!before) return res.status(404).json({ success: false, error: 'Not found.' });

    const { route_id, articles_received, articles_delivered, undelivered_reason, notes } = req.body;

    const received  = articles_received  !== undefined ? parseInt(articles_received)  : before.articles_received;
    const delivered = articles_delivered !== undefined ? parseInt(articles_delivered) : before.articles_delivered;
    const undelivered = received - delivered;

    if (undelivered < 0) {
      return res.status(400).json({ success: false, error: 'articles_delivered cannot exceed articles_received.' });
    }

    const result = await pool.query(
      `UPDATE vp_delivery_logs
       SET route_id=COALESCE($1,route_id),
           articles_received=$2, articles_delivered=$3, articles_undelivered=$4,
           undelivered_reason=COALESCE($5,undelivered_reason),
           notes=COALESCE($6,notes), updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [route_id||null, received, delivered, undelivered, undelivered_reason||null, notes||null, id]
    );

    await audit.log({
      userId: req.user.id, action: 'UPDATE', table: 'vp_delivery_logs',
      recordId: parseInt(id), before, after: result.rows[0]
    });

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

module.exports = { listDeliveryLogs, getMonthlyDelivery, createLog, updateLog };
