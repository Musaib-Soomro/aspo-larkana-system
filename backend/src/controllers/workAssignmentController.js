const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listAssignments(req, res, next) {
  try {
    const { page = 1, limit = 20, staff_id, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (staff_id) { params.push(parseInt(staff_id)); conditions.push(`a.staff_id=$${params.length}`); }
    if (status)   { params.push(status);             conditions.push(`a.status=$${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countParams = [...params];
    params.push(parseInt(limit)); params.push(offset);

    const result = await pool.query(
      `SELECT a.*, s.full_name AS staff_name
       FROM work_assignments a
       JOIN staff s ON s.id = a.staff_id
       ${where}
       ORDER BY a.status='Open' DESC, a.due_date ASC NULLS LAST, a.assigned_date DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM work_assignments a ${where}`, countParams
    );
    const total = parseInt(count.rows[0].count);

    return res.json({
      success: true, data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
}

async function getAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT a.*, s.full_name AS staff_name FROM work_assignments a JOIN staff s ON s.id=a.staff_id WHERE a.id=$1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function createAssignment(req, res, next) {
  try {
    const { staff_id, assigned_date, title, description, order_type, order_reference, due_date } = req.body;
    if (!staff_id || !assigned_date || !title || !order_type) {
      return res.status(400).json({ success: false, error: 'staff_id, assigned_date, title, order_type are required.' });
    }

    const result = await pool.query(
      `INSERT INTO work_assignments (staff_id, assigned_date, title, description, order_type, order_reference, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [staff_id, assigned_date, title, description||null, order_type, order_reference||null, due_date||null]
    );

    await audit.log({
      userId: req.user.id, action: 'INSERT', table: 'work_assignments',
      recordId: result.rows[0].id, after: result.rows[0]
    });

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const before = (await pool.query('SELECT * FROM work_assignments WHERE id=$1', [id])).rows[0];
    if (!before) return res.status(404).json({ success: false, error: 'Not found.' });

    const { status, completion_date, completion_notes, title, description, order_type, order_reference, due_date } = req.body;

    if (status === 'Completed' && !completion_date) {
      return res.status(400).json({ success: false, error: 'completion_date is required when marking as Completed.' });
    }

    const result = await pool.query(
      `UPDATE work_assignments
       SET title=COALESCE($1,title),
           description=COALESCE($2,description),
           order_type=COALESCE($3,order_type),
           order_reference=COALESCE($4,order_reference),
           due_date=COALESCE($5,due_date),
           status=COALESCE($6,status),
           completion_date=$7,
           completion_notes=COALESCE($8,completion_notes),
           updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title||null, description||null, order_type||null, order_reference||null, due_date||null,
       status||null, completion_date||null, completion_notes||null, id]
    );

    await audit.log({
      userId: req.user.id, action: 'UPDATE', table: 'work_assignments',
      recordId: parseInt(id), before, after: result.rows[0]
    });

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

module.exports = { listAssignments, getAssignment, createAssignment, updateAssignment };
