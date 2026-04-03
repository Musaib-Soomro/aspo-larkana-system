const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listVPArticles(req, res, next) {
  try {
    const { office_id, status, article_type, date_from, date_to } = req.query;
    if (!office_id) return res.status(400).json({ success: false, error: 'office_id is required.' });

    const params = [office_id];
    const conditions = ['va.office_id = $1'];

    if (status) { params.push(status); conditions.push(`va.status = $${params.length}`); }
    if (article_type) { params.push(article_type); conditions.push(`va.article_type = $${params.length}`); }
    if (date_from) { params.push(date_from); conditions.push(`va.date_received >= $${params.length}`); }
    if (date_to) { params.push(date_to); conditions.push(`va.date_received <= $${params.length}`); }

    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT va.*, o.name AS office_name,
              CURRENT_DATE - va.date_received AS days_since_received
       FROM vp_articles va
       JOIN offices o ON o.id = va.office_id
       WHERE ${where}
       ORDER BY va.date_received DESC`,
      params
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getVPArticle(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT va.*, o.name AS office_name,
              CURRENT_DATE - va.date_received AS days_since_received
       FROM vp_articles va
       JOIN offices o ON o.id = va.office_id
       WHERE va.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createVPArticle(req, res, next) {
  try {
    const { office_id, article_type, tracking_id, date_received, value_amount, booking_city, addressee_name, notes } = req.body;
    if (!office_id || !article_type || !tracking_id || !date_received) {
      return res.status(400).json({ success: false, error: 'office_id, article_type, tracking_id, and date_received are required.' });
    }

    const result = await pool.query(
      `INSERT INTO vp_articles (office_id, article_type, tracking_id, date_received, value_amount, booking_city, addressee_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [office_id, article_type, tracking_id.toUpperCase(), date_received, value_amount || 0, booking_city || null, addressee_name || null, notes || null]
    );

    await audit.log({ userId: req.user.id, action: 'CREATE', table: 'vp_articles', recordId: result.rows[0].id, before: null, after: result.rows[0] });
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: 'Tracking ID already exists for this office.' });
    next(err);
  }
}

async function updateVPArticle(req, res, next) {
  try {
    const { id } = req.params;
    const before = await pool.query('SELECT * FROM vp_articles WHERE id = $1', [id]);
    if (!before.rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });

    const {
      status, date_delivered, mo_type, mo_number,
      value_amount, booking_city, addressee_name, notes
    } = req.body;

    // Calculate demurrage if delivering
    let demurrage_days = before.rows[0].demurrage_days;
    let demurrage_amount = before.rows[0].demurrage_amount;
    if (status === 'Delivered' && date_delivered) {
      const received = new Date(before.rows[0].date_received);
      const delivered = new Date(date_delivered);
      const days = Math.floor((delivered - received) / (1000 * 60 * 60 * 24));
      demurrage_days = Math.max(0, days - 7);
      demurrage_amount = demurrage_days * 10;
    }

    const result = await pool.query(
      `UPDATE vp_articles SET
         status = COALESCE($1, status),
         date_delivered = $2,
         mo_type = $3,
         mo_number = $4,
         demurrage_days = $5,
         demurrage_amount = $6,
         value_amount = COALESCE($7, value_amount),
         booking_city = COALESCE($8, booking_city),
         addressee_name = COALESCE($9, addressee_name),
         notes = $10,
         updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        status || null,
        date_delivered || null,
        mo_type || null,
        mo_number || null,
        demurrage_days,
        demurrage_amount,
        value_amount || null,
        booking_city || null,
        addressee_name || null,
        notes !== undefined ? notes : before.rows[0].notes,
        id,
      ]
    );

    await audit.log({ userId: req.user.id, action: 'UPDATE', table: 'vp_articles', recordId: parseInt(id, 10), before: before.rows[0], after: result.rows[0] });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteVPArticle(req, res, next) {
  try {
    const before = await pool.query('SELECT * FROM vp_articles WHERE id = $1', [req.params.id]);
    if (!before.rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    await pool.query('DELETE FROM vp_articles WHERE id = $1', [req.params.id]);
    await audit.log({ userId: req.user.id, action: 'DELETE', table: 'vp_articles', recordId: parseInt(req.params.id, 10), before: before.rows[0], after: null });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Late Deliveries (RGL, PAR, IRP, UMS)
async function listLateDeliveries(req, res, next) {
  try {
    const { office_id, date_from, date_to } = req.query;
    if (!office_id) return res.status(400).json({ success: false, error: 'office_id is required.' });

    const params = [office_id];
    const conditions = ['ld.office_id = $1'];
    if (date_from) { params.push(date_from); conditions.push(`ld.date_delivered >= $${params.length}`); }
    if (date_to) { params.push(date_to); conditions.push(`ld.date_delivered <= $${params.length}`); }

    const result = await pool.query(
      `SELECT ld.* FROM late_deliveries ld
       WHERE ${conditions.join(' AND ')}
       ORDER BY ld.date_delivered DESC`,
      params
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createLateDelivery(req, res, next) {
  try {
    const { office_id, article_type, tracking_id, date_received, date_delivered, addressee_name, notes } = req.body;
    if (!office_id || !article_type || !tracking_id || !date_received || !date_delivered) {
      return res.status(400).json({ success: false, error: 'office_id, article_type, tracking_id, date_received, and date_delivered are required.' });
    }

    const received = new Date(date_received);
    const delivered = new Date(date_delivered);
    const days_held = Math.max(0, Math.floor((delivered - received) / (1000 * 60 * 60 * 24)));
    const demurrage_days = Math.max(0, days_held - 7);
    const demurrage_amount = demurrage_days * 10;

    const result = await pool.query(
      `INSERT INTO late_deliveries (office_id, article_type, tracking_id, date_received, date_delivered, days_held, demurrage_days, demurrage_amount, addressee_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [office_id, article_type, tracking_id.toUpperCase(), date_received, date_delivered, days_held, demurrage_days, demurrage_amount, addressee_name || null, notes || null]
    );

    await audit.log({ userId: req.user.id, action: 'CREATE', table: 'late_deliveries', recordId: result.rows[0].id, before: null, after: result.rows[0] });
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteLateDelivery(req, res, next) {
  try {
    const before = await pool.query('SELECT * FROM late_deliveries WHERE id = $1', [req.params.id]);
    if (!before.rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    await pool.query('DELETE FROM late_deliveries WHERE id = $1', [req.params.id]);
    await audit.log({ userId: req.user.id, action: 'DELETE', table: 'late_deliveries', recordId: parseInt(req.params.id, 10), before: before.rows[0], after: null });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listVPArticles, getVPArticle, createVPArticle, updateVPArticle, deleteVPArticle,
  listLateDeliveries, createLateDelivery, deleteLateDelivery,
};
