const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listInspections(req, res, next) {
  try {
    const { year, half, office_id, status, month, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (year) { params.push(year); conditions.push(`ip.year = $${params.length}`); }
    if (half) { params.push(half); conditions.push(`ip.half = $${params.length}`); }
    if (office_id) { params.push(office_id); conditions.push(`ip.office_id = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`ip.status = $${params.length}`); }
    if (month) { params.push(month); conditions.push(`ip.allotted_month = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit, 10));
    params.push(offset);

    const result = await pool.query(
      `SELECT ip.*, o.name AS office_name, o.tehsil
       FROM inspection_programme ip
       JOIN offices o ON o.id = ip.office_id
       ${where}
       ORDER BY ip.year DESC, ip.allotted_month, o.name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countResult = await pool.query(`SELECT COUNT(*) FROM inspection_programme ip ${where}`, countParams);
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

async function getDueThisMonth(req, res, next) {
  try {
    const now = new Date();
    const result = await pool.query(
      `SELECT ip.*, o.name AS office_name
       FROM inspection_programme ip
       JOIN offices o ON o.id = ip.office_id
       WHERE ip.allotted_month = $1 AND ip.year = $2 AND ip.status = 'Pending'
       ORDER BY o.name`,
      [now.getMonth() + 1, now.getFullYear()]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getOverdue(req, res, next) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentHalf = currentMonth <= 6 ? 'First' : 'Second';

    const result = await pool.query(
      `SELECT ip.*, o.name AS office_name
       FROM inspection_programme ip
       JOIN offices o ON o.id = ip.office_id
       WHERE ip.allotted_month < $1 AND ip.year = $2 AND ip.half = $3 AND ip.status = 'Pending'
       ORDER BY ip.allotted_month, o.name`,
      [currentMonth, currentYear, currentHalf]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getInspection(req, res, next) {
  try {
    const { id } = req.params;
    const [ipResult, visitsResult] = await Promise.all([
      pool.query(
        `SELECT ip.*, o.name AS office_name FROM inspection_programme ip
         JOIN offices o ON o.id = ip.office_id WHERE ip.id = $1`,
        [id]
      ),
      pool.query('SELECT * FROM inspection_visits WHERE programme_id = $1 ORDER BY visit_date', [id]),
    ]);
    if (!ipResult.rows[0]) return res.status(404).json({ success: false, error: 'Inspection not found.' });
    return res.json({ success: true, data: { ...ipResult.rows[0], visits: visitsResult.rows } });
  } catch (err) {
    next(err);
  }
}

async function createProgramme(req, res, next) {
  try {
    const { year, half, entries } = req.body;
    if (!Array.isArray(entries) || !entries.length) {
      return res.status(400).json({ success: false, error: 'entries array is required.' });
    }

    const inserted = [];
    for (const entry of entries) {
      const result = await pool.query(
        `INSERT INTO inspection_programme (year, half, office_id, allotted_month, inspecting_officer)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (year, half, office_id) DO UPDATE
           SET allotted_month = EXCLUDED.allotted_month,
               inspecting_officer = EXCLUDED.inspecting_officer,
               updated_at = NOW()
         RETURNING *`,
        [year, half, entry.office_id, entry.allotted_month, entry.inspecting_officer]
      );
      inserted.push(result.rows[0]);
    }

    return res.status(201).json({ success: true, data: inserted, message: `${inserted.length} entries saved.` });
  } catch (err) {
    next(err);
  }
}

async function updateInspection(req, res, next) {
  try {
    const { id } = req.params;
    const before = await pool.query('SELECT * FROM inspection_programme WHERE id = $1', [id]);
    if (!before.rows[0]) return res.status(404).json({ success: false, error: 'Inspection not found.' });

    const fields = ['status', 'completed_date', 'order_book_remarks', 'remarks_submitted_to_dsps', 'remarks_submission_date'];
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
      `UPDATE inspection_programme SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} RETURNING *`,
      params
    );

    await audit.log({ userId: req.user.id, action: 'UPDATE', table: 'inspection_programme', recordId: parseInt(id, 10), before: before.rows[0], after: result.rows[0] });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function addVisit(req, res, next) {
  try {
    const { id } = req.params;
    const { visit_date, departure_time, arrival_time, return_time, distance_km, day_type, notes, checklist = [] } = req.body;

    const result = await pool.query(
      `INSERT INTO inspection_visits (programme_id, visit_date, departure_time, arrival_time, return_time, distance_km, day_type, notes, checklist)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, visit_date, departure_time, arrival_time, return_time, distance_km, day_type, notes, JSON.stringify(checklist)]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteVisit(req, res, next) {
  try {
    const { visitId } = req.params;
    const result = await pool.query('DELETE FROM inspection_visits WHERE id = $1 RETURNING id', [visitId]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Visit not found.' });
    return res.json({ success: true, message: 'Visit removed.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listInspections, getDueThisMonth, getOverdue, getInspection, createProgramme, updateInspection, addVisit, deleteVisit };
