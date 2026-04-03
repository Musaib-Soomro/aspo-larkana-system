const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listRevenue(req, res, next) {
  try {
    let { month, year, office_id, is_draft, page = 1, limit = 20 } = req.query;

    // Postmasters can only see their own office's revenue
    if (req.user.role === 'postmaster') {
      if (!req.user.office_id) return res.status(403).json({ success: false, error: 'No office assigned to your account.' });
      office_id = req.user.office_id;
    }
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (month) { params.push(month); conditions.push(`re.month = $${params.length}`); }
    if (year) { params.push(year); conditions.push(`re.year = $${params.length}`); }
    if (office_id) { params.push(office_id); conditions.push(`re.office_id = $${params.length}`); }
    if (is_draft !== undefined) { params.push(is_draft === 'true'); conditions.push(`re.is_draft = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit, 10));
    params.push(offset);

    const result = await pool.query(
      `SELECT re.*, o.name AS office_name
       FROM revenue_entries re
       JOIN offices o ON o.id = re.office_id
       ${where}
       ORDER BY re.year DESC, re.month DESC, o.name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countResult = await pool.query(`SELECT COUNT(*) FROM revenue_entries re ${where}`, countParams);
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

async function getPendingOffices(req, res, next) {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, error: 'month and year are required.' });
    }
    const result = await pool.query(
      `SELECT o.id, o.name, o.tehsil, re.id AS entry_id, re.is_draft
       FROM offices o
       LEFT JOIN revenue_entries re ON re.office_id = o.id AND re.month = $1 AND re.year = $2
       WHERE o.is_active = true
       ORDER BY o.name`,
      [month, year]
    );

    const pending = result.rows.filter((r) => !r.entry_id || r.is_draft);
    const submitted = result.rows.filter((r) => r.entry_id && !r.is_draft);

    return res.json({ success: true, data: { pending, submitted, total: result.rows.length } });
  } catch (err) {
    next(err);
  }
}

async function getRevenueEntry(req, res, next) {
  try {
    const { id } = req.params;
    const [entryResult, dataResult] = await Promise.all([
      pool.query('SELECT re.*, o.name AS office_name FROM revenue_entries re JOIN offices o ON o.id = re.office_id WHERE re.id = $1', [id]),
      pool.query('SELECT * FROM revenue_data WHERE entry_id = $1 ORDER BY category, sub_category', [id]),
    ]);
    if (!entryResult.rows[0]) return res.status(404).json({ success: false, error: 'Revenue entry not found.' });
    return res.json({ success: true, data: { ...entryResult.rows[0], data: dataResult.rows } });
  } catch (err) {
    next(err);
  }
}

async function upsertRevenue(req, res, next) {
  try {
    let { office_id, month, year, is_draft = true, submitted_by, submitted_date, data = [] } = req.body;

    // Postmasters can only submit revenue for their own office
    if (req.user.role === 'postmaster') {
      if (!req.user.office_id) return res.status(403).json({ success: false, error: 'No office assigned to your account.' });
      if (office_id && parseInt(office_id, 10) !== req.user.office_id) {
        return res.status(403).json({ success: false, error: 'You can only submit revenue for your assigned office.' });
      }
      office_id = req.user.office_id;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Upsert entry
      const entryResult = await client.query(
        `INSERT INTO revenue_entries (office_id, month, year, is_draft, submitted_by, submitted_date)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (office_id, month, year) DO UPDATE
           SET is_draft = EXCLUDED.is_draft,
               submitted_by = EXCLUDED.submitted_by,
               submitted_date = EXCLUDED.submitted_date,
               updated_at = NOW()
         RETURNING *`,
        [office_id, month, year, is_draft, submitted_by, submitted_date || null]
      );

      const entryId = entryResult.rows[0].id;

      // Replace revenue_data
      await client.query('DELETE FROM revenue_data WHERE entry_id = $1', [entryId]);
      for (const row of data) {
        await client.query(
          'INSERT INTO revenue_data (entry_id, category, sub_category, value, unit) VALUES ($1,$2,$3,$4,$5)',
          [entryId, row.category, row.sub_category, row.value || 0, row.unit]
        );
      }

      await client.query('COMMIT');
      await audit.log({ userId: req.user.id, action: 'INSERT', table: 'revenue_entries', recordId: entryId, after: entryResult.rows[0] });
      return res.status(201).json({ success: true, data: entryResult.rows[0] });
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

async function updateRevenue(req, res, next) {
  try {
    const { id } = req.params;
    const { is_draft, submitted_date, submitted_by, data } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE revenue_entries
         SET is_draft = COALESCE($1, is_draft),
             submitted_date = COALESCE($2, submitted_date),
             submitted_by = COALESCE($3, submitted_by),
             updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [is_draft, submitted_date, submitted_by, id]
      );

      if (!result.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Revenue entry not found.' });
      }

      if (data) {
        await client.query('DELETE FROM revenue_data WHERE entry_id = $1', [id]);
        for (const row of data) {
          await client.query(
            'INSERT INTO revenue_data (entry_id, category, sub_category, value, unit) VALUES ($1,$2,$3,$4,$5)',
            [id, row.category, row.sub_category, row.value || 0, row.unit]
          );
        }
      }

      await client.query('COMMIT');
      return res.json({ success: true, data: result.rows[0] });
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

async function getMonthlyTotals(req, res, next) {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, error: 'month and year are required.' });
    }

    const result = await pool.query(
      `SELECT rd.category, rd.sub_category, rd.unit,
              SUM(rd.value) AS total,
              COUNT(DISTINCT re.office_id) AS offices_count
       FROM revenue_data rd
       JOIN revenue_entries re ON re.id = rd.entry_id
       WHERE re.month = $1 AND re.year = $2 AND re.is_draft = false
       GROUP BY rd.category, rd.sub_category, rd.unit
       ORDER BY rd.category, rd.sub_category`,
      [month, year]
    );

    const submittedCount = await pool.query(
      `SELECT COUNT(*) FROM revenue_entries WHERE month = $1 AND year = $2 AND is_draft = false`,
      [month, year]
    );

    return res.json({
      success: true,
      data: result.rows,
      submitted_count: parseInt(submittedCount.rows[0].count, 10),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listRevenue, getPendingOffices, getRevenueEntry, upsertRevenue, updateRevenue, getMonthlyTotals };
