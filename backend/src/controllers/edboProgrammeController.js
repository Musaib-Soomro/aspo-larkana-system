const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listProgrammes(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await pool.query(
      `SELECT p.id, p.year, p.staff_id, p.notes, p.created_at,
              s.full_name AS staff_name,
              COUNT(a.id)                                          AS total,
              COUNT(a.id) FILTER (WHERE a.status='Completed')     AS completed,
              COUNT(a.id) FILTER (WHERE a.status='Pending')       AS pending,
              COUNT(a.id) FILTER (WHERE a.status='Carried Forward') AS carried_forward
       FROM edbo_programmes p
       JOIN staff s ON s.id = p.staff_id
       LEFT JOIN edbo_assignments a ON a.programme_id = p.id
       GROUP BY p.id, s.full_name
       ORDER BY p.year DESC, p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    const count = await pool.query('SELECT COUNT(*) FROM edbo_programmes');
    const total = parseInt(count.rows[0].count);

    return res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
}

async function getProgramme(req, res, next) {
  try {
    const { id } = req.params;

    const prog = (await pool.query(
      `SELECT p.*, s.full_name AS staff_name
       FROM edbo_programmes p
       JOIN staff s ON s.id = p.staff_id
       WHERE p.id=$1`,
      [id]
    )).rows[0];
    if (!prog) return res.status(404).json({ success: false, error: 'Not found.' });

    const assignments = await pool.query(
      `SELECT * FROM edbo_assignments WHERE programme_id=$1 ORDER BY assigned_month, edbo_name`,
      [id]
    );

    // Group assignments by month
    const byMonth = {};
    for (const a of assignments.rows) {
      if (!byMonth[a.assigned_month]) byMonth[a.assigned_month] = [];
      byMonth[a.assigned_month].push(a);
    }

    return res.json({ success: true, data: { ...prog, assignments: assignments.rows, by_month: byMonth } });
  } catch (err) { next(err); }
}

async function createProgramme(req, res, next) {
  try {
    const { year, staff_id, notes, assignments } = req.body;
    if (!year || !staff_id) return res.status(400).json({ success: false, error: 'year and staff_id are required.' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const prog = (await client.query(
        `INSERT INTO edbo_programmes (year, staff_id, notes) VALUES ($1,$2,$3) RETURNING *`,
        [year, staff_id, notes || null]
      )).rows[0];

      if (assignments && assignments.length > 0) {
        for (const a of assignments) {
          await client.query(
            `INSERT INTO edbo_assignments (programme_id, edbo_name, assigned_month) VALUES ($1,$2,$3)`,
            [prog.id, a.edbo_name, a.assigned_month]
          );
        }
      }

      await client.query('COMMIT');

      await audit.log({
        userId: req.user.id, action: 'INSERT', table: 'edbo_programmes',
        recordId: prog.id, after: prog
      });

      return res.status(201).json({ success: true, data: prog });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally { client.release(); }
  } catch (err) { next(err); }
}

async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const { status, completed_date, remarks } = req.body;

    const before = (await pool.query('SELECT * FROM edbo_assignments WHERE id=$1', [id])).rows[0];
    if (!before) return res.status(404).json({ success: false, error: 'Assignment not found.' });

    if (status === 'Completed' && !completed_date) {
      return res.status(400).json({ success: false, error: 'completed_date is required when marking as Completed.' });
    }

    const result = await pool.query(
      `UPDATE edbo_assignments
       SET status=COALESCE($1,status), completed_date=$2, remarks=COALESCE($3,remarks)
       WHERE id=$4 RETURNING *`,
      [status || null, completed_date || null, remarks || null, id]
    );

    await audit.log({
      userId: req.user.id, action: 'UPDATE', table: 'edbo_assignments',
      recordId: parseInt(id), before, after: result.rows[0]
    });

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

module.exports = { listProgrammes, getProgramme, createProgramme, updateAssignment };
