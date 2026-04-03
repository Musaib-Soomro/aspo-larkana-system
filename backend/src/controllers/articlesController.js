const pool = require('../models/db');
const audit = require('../services/auditLog');

const ARTICLE_TYPES = ['RGL', 'PAR', 'VPP', 'VPL', 'COD', 'UMS', 'IRP'];

async function listEntries(req, res, next) {
  try {
    let { office_id, date_from, date_to } = req.query;

    // Postmasters can only view their own office's articles
    if (req.user.role === 'postmaster') {
      if (!req.user.office_id) return res.status(403).json({ success: false, error: 'No office assigned to your account.' });
      office_id = req.user.office_id;
    }

    if (!office_id) return res.status(400).json({ success: false, error: 'office_id is required.' });

    const params = [office_id];
    const conditions = ['da.office_id = $1'];

    if (date_from) { params.push(date_from); conditions.push(`da.record_date >= $${params.length}`); }
    if (date_to) { params.push(date_to); conditions.push(`da.record_date <= $${params.length}`); }

    const where = conditions.join(' AND ');

    // Return one row per date, with per-type counts as columns
    const result = await pool.query(
      `SELECT
         da.record_date,
         MAX(CASE WHEN da.article_type = 'RGL' THEN da.received ELSE 0 END) AS rgl,
         MAX(CASE WHEN da.article_type = 'PAR' THEN da.received ELSE 0 END) AS par,
         MAX(CASE WHEN da.article_type = 'VPP' THEN da.received ELSE 0 END) AS vpp,
         MAX(CASE WHEN da.article_type = 'VPL' THEN da.received ELSE 0 END) AS vpl,
         MAX(CASE WHEN da.article_type = 'COD' THEN da.received ELSE 0 END) AS cod,
         MAX(CASE WHEN da.article_type = 'UMS' THEN da.received ELSE 0 END) AS ums,
         MAX(CASE WHEN da.article_type = 'IRP' THEN da.received ELSE 0 END) AS irp,
         SUM(da.received) AS total_received
       FROM daily_articles da
       WHERE ${where}
       GROUP BY da.record_date
       ORDER BY da.record_date DESC`,
      params
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getEntry(req, res, next) {
  try {
    const { office_id, date } = req.query;
    if (!office_id || !date) return res.status(400).json({ success: false, error: 'office_id and date are required.' });

    const result = await pool.query(
      `SELECT article_type, in_deposit, received, delivered, returned, notes
       FROM daily_articles
       WHERE office_id = $1 AND record_date = $2`,
      [office_id, date]
    );

    // Build a complete response with all 7 types (zeros for missing)
    const existing = {};
    result.rows.forEach((r) => { existing[r.article_type] = r; });

    const data = ARTICLE_TYPES.map((type) => ({
      article_type: type,
      in_deposit: existing[type]?.in_deposit ?? 0,
      received: existing[type]?.received ?? 0,
      delivered: existing[type]?.delivered ?? 0,
      returned: existing[type]?.returned ?? 0,
      notes: existing[type]?.notes || '',
    }));

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function upsertEntry(req, res, next) {
  const client = await pool.connect();
  try {
    let { office_id, record_date, rows } = req.body;

    // Postmasters can only submit for their own office
    if (req.user.role === 'postmaster') {
      if (!req.user.office_id) return res.status(403).json({ success: false, error: 'No office assigned to your account.' });
      if (office_id && parseInt(office_id, 10) !== req.user.office_id) {
        return res.status(403).json({ success: false, error: 'You can only enter articles for your assigned office.' });
      }
      office_id = req.user.office_id;
    }

    if (!office_id || !record_date || !Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ success: false, error: 'office_id, record_date, and rows are required.' });
    }

    await client.query('BEGIN');

    const saved = [];
    for (const row of rows) {
      const { article_type, in_deposit = 0, received = 0, delivered = 0, returned = 0, notes = null } = row;
      if (!ARTICLE_TYPES.includes(article_type)) continue;

      const result = await client.query(
        `INSERT INTO daily_articles (office_id, record_date, article_type, in_deposit, received, delivered, returned, notes, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (office_id, record_date, article_type) DO UPDATE SET
           in_deposit = EXCLUDED.in_deposit,
           received = EXCLUDED.received,
           delivered = EXCLUDED.delivered,
           returned = EXCLUDED.returned,
           notes = EXCLUDED.notes,
           updated_at = NOW()
         RETURNING *`,
        [office_id, record_date, article_type, in_deposit, received, delivered, returned, notes || null]
      );
      saved.push(result.rows[0]);
    }

    await client.query('COMMIT');

    await audit.log({
      userId: req.user.id,
      action: 'UPSERT',
      table: 'daily_articles',
      recordId: null,
      before: null,
      after: { office_id, record_date, rows: saved.length },
    });

    return res.json({ success: true, data: saved });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function deleteEntry(req, res, next) {
  try {
    const { office_id, date } = req.query;
    if (!office_id || !date) return res.status(400).json({ success: false, error: 'office_id and date are required.' });

    await pool.query(
      'DELETE FROM daily_articles WHERE office_id = $1 AND record_date = $2',
      [office_id, date]
    );

    await audit.log({
      userId: req.user.id,
      action: 'DELETE',
      table: 'daily_articles',
      recordId: null,
      before: { office_id, date },
      after: null,
    });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEntries, getEntry, upsertEntry, deleteEntry };
