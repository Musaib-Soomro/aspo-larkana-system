const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listDiaries(req, res, next) {
  try {
    const { page = 1, limit = 20, year, staff_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (year) { params.push(parseInt(year)); conditions.push(`EXTRACT(YEAR FROM d.week_start_date)=$${params.length}`); }
    if (staff_id) { params.push(parseInt(staff_id)); conditions.push(`d.staff_id=$${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countParams = [...params];
    params.push(parseInt(limit)); params.push(offset);

    const result = await pool.query(
      `SELECT d.*, s.full_name AS staff_name
       FROM overseer_diaries d
       JOIN staff s ON s.id = d.staff_id
       ${where}
       ORDER BY d.week_start_date DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM overseer_diaries d ${where}`, countParams
    );
    const total = parseInt(count.rows[0].count);

    return res.json({
      success: true, data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
}

async function getDiary(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT d.*, s.full_name AS staff_name FROM overseer_diaries d JOIN staff s ON s.id=d.staff_id WHERE d.id=$1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function createDiary(req, res, next) {
  try {
    const { staff_id, week_start_date, week_end_date, places_visited, work_summary, observations, submitted_date } = req.body;
    if (!staff_id || !week_start_date || !week_end_date) {
      return res.status(400).json({ success: false, error: 'staff_id, week_start_date, week_end_date are required.' });
    }

    const result = await pool.query(
      `INSERT INTO overseer_diaries (staff_id, week_start_date, week_end_date, places_visited, work_summary, observations, submitted_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [staff_id, week_start_date, week_end_date, places_visited||null, work_summary||null, observations||null, submitted_date||null]
    );

    await audit.log({
      userId: req.user.id, action: 'INSERT', table: 'overseer_diaries',
      recordId: result.rows[0].id, after: result.rows[0]
    });

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateDiary(req, res, next) {
  try {
    const { id } = req.params;
    const before = (await pool.query('SELECT * FROM overseer_diaries WHERE id=$1', [id])).rows[0];
    if (!before) return res.status(404).json({ success: false, error: 'Not found.' });

    const { places_visited, work_summary, observations, submitted_date } = req.body;

    const result = await pool.query(
      `UPDATE overseer_diaries
       SET places_visited=$1, work_summary=$2, observations=$3, submitted_date=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [places_visited??before.places_visited, work_summary??before.work_summary,
       observations??before.observations, submitted_date??before.submitted_date, id]
    );

    await audit.log({
      userId: req.user.id, action: 'UPDATE', table: 'overseer_diaries',
      recordId: parseInt(id), before, after: result.rows[0]
    });

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

module.exports = { listDiaries, getDiary, createDiary, updateDiary };
