const pool = require('../models/db');

async function listAuditLog(req, res, next) {
  try {
    const { table_name, action, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (table_name) { params.push(table_name); conditions.push(`al.table_name = $${params.length}`); }
    if (action)     { params.push(action);     conditions.push(`al.action = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit, 10));
    params.push(offset);

    const result = await pool.query(
      `SELECT al.id, al.action, al.table_name, al.record_id, al.changes, al.created_at,
              u.username
       FROM audit_log al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countResult = await pool.query(`SELECT COUNT(*) FROM audit_log al ${where}`, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAuditLog };
