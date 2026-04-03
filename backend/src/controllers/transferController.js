const pool = require('../models/db');
const audit = require('../services/auditLog');

async function listTransfers(req, res, next) {
  try {
    const { page = 1, limit = 20, staff_id, status, from_office_id, to_office_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (staff_id) { params.push(parseInt(staff_id)); conditions.push(`tr.staff_id = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`tr.status = $${params.length}`); }
    if (from_office_id) { params.push(parseInt(from_office_id)); conditions.push(`tr.from_office_id = $${params.length}`); }
    if (to_office_id) { params.push(parseInt(to_office_id)); conditions.push(`tr.to_office_id = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countParams = [...params];
    params.push(parseInt(limit));
    params.push(offset);

    const result = await pool.query(
      `SELECT tr.*,
              s.full_name AS staff_name,
              s.designation,
              fo.name AS from_office_name,
              too.name AS to_office_name,
              (tr.joining_date - tr.relieving_date) AS transit_days
       FROM transfer_records tr
       JOIN staff s ON s.id = tr.staff_id
       JOIN offices fo ON fo.id = tr.from_office_id
       JOIN offices too ON too.id = tr.to_office_id
       ${where}
       ORDER BY tr.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM transfer_records tr ${where}`,
      countParams
    );
    const total = parseInt(count.rows[0].count);

    return res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
}

async function getTransfer(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT tr.*,
              s.full_name AS staff_name,
              s.designation,
              fo.name AS from_office_name,
              too.name AS to_office_name,
              (tr.joining_date - tr.relieving_date) AS transit_days
       FROM transfer_records tr
       JOIN staff s ON s.id = tr.staff_id
       JOIN offices fo ON fo.id = tr.from_office_id
       JOIN offices too ON too.id = tr.to_office_id
       WHERE tr.id = $1`,
      [id]
    );

    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Not found.' });

    const tr = result.rows[0];
    const maxAllowedDays = (tr.transit_extension_granted && tr.transit_extension_days)
      ? 7 + parseInt(tr.transit_extension_days)
      : 7;

    let isOverdue = false;
    if (tr.status === 'Relieved' && tr.relieving_date) {
      const deadline = new Date(tr.relieving_date);
      deadline.setDate(deadline.getDate() + maxAllowedDays);
      isOverdue = new Date() > deadline;
    }

    return res.json({
      success: true,
      data: { ...tr, max_allowed_days: maxAllowedDays, is_overdue: isOverdue }
    });
  } catch (err) { next(err); }
}

async function createTransfer(req, res, next) {
  try {
    const {
      staff_id, directed_by, reference_letter_no, reference_letter_date,
      transfer_order_date, from_office_id, to_office_id, notes
    } = req.body;

    // Guard: check for active transfer
    const existing = await pool.query(
      `SELECT id FROM transfer_records WHERE staff_id = $1 AND status IN ('Ordered','Relieved')`,
      [staff_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Active transfer already exists for this staff member.' });
    }

    const result = await pool.query(
      `INSERT INTO transfer_records
         (staff_id, directed_by, reference_letter_no, reference_letter_date,
          transfer_order_date, from_office_id, to_office_id, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Ordered')
       RETURNING *`,
      [staff_id, directed_by, reference_letter_no, reference_letter_date,
       transfer_order_date, from_office_id, to_office_id, notes || null]
    );

    await audit.log({
      userId: req.user.id, action: 'INSERT', table: 'transfer_records',
      recordId: result.rows[0].id, after: result.rows[0]
    });

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateTransfer(req, res, next) {
  try {
    const { id } = req.params;
    const before = (await pool.query('SELECT * FROM transfer_records WHERE id=$1', [id])).rows[0];
    if (!before) return res.status(404).json({ success: false, error: 'Not found.' });

    const { relieving_date, joining_date, status, transit_extension_requested,
            transit_extension_granted, transit_extension_days,
            transit_extension_authority, transit_extension_order_ref } = req.body;

    // Joining date → transaction: update transfer + staff record
    if (joining_date) {
      if (before.status !== 'Relieved') {
        return res.status(400).json({ success: false, error: 'Staff must be relieved before joining can be recorded.' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const transferResult = await client.query(
          `UPDATE transfer_records
           SET joining_date=$1, status='Completed', updated_at=NOW()
           WHERE id=$2 RETURNING *`,
          [joining_date, id]
        );

        await client.query(
          `UPDATE staff
           SET office_id=$1, current_posting_date=$2, updated_at=NOW()
           WHERE id=$3`,
          [before.to_office_id, joining_date, before.staff_id]
        );

        await client.query('COMMIT');

        await audit.log({
          userId: req.user.id, action: 'UPDATE', table: 'transfer_records',
          recordId: parseInt(id), before, after: transferResult.rows[0]
        });

        return res.json({ success: true, data: transferResult.rows[0] });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // Relieving date
    if (relieving_date) {
      if (before.status !== 'Ordered') {
        return res.status(400).json({ success: false, error: 'Transfer must be in Ordered status to record relieving.' });
      }
      if (new Date(relieving_date) < new Date(before.transfer_order_date)) {
        return res.status(400).json({ success: false, error: 'Relieving date cannot be before transfer order date.' });
      }

      const result = await pool.query(
        `UPDATE transfer_records
         SET relieving_date=$1, status='Relieved', updated_at=NOW()
         WHERE id=$2 RETURNING *`,
        [relieving_date, id]
      );

      await audit.log({
        userId: req.user.id, action: 'UPDATE', table: 'transfer_records',
        recordId: parseInt(id), before, after: result.rows[0]
      });

      return res.json({ success: true, data: result.rows[0] });
    }

    // Cancellation
    if (status === 'Cancelled') {
      if (!['Ordered', 'Relieved'].includes(before.status)) {
        return res.status(400).json({ success: false, error: 'Only Ordered or Relieved transfers can be cancelled.' });
      }

      const result = await pool.query(
        `UPDATE transfer_records SET status='Cancelled', updated_at=NOW() WHERE id=$1 RETURNING *`,
        [id]
      );

      await audit.log({
        userId: req.user.id, action: 'UPDATE', table: 'transfer_records',
        recordId: parseInt(id), before, after: result.rows[0]
      });

      return res.json({ success: true, data: result.rows[0] });
    }

    // Extension fields
    if (transit_extension_requested !== undefined || transit_extension_granted !== undefined ||
        transit_extension_days !== undefined || transit_extension_authority !== undefined ||
        transit_extension_order_ref !== undefined) {

      const updates = [];
      const params = [];

      if (transit_extension_requested !== undefined) {
        params.push(transit_extension_requested); updates.push(`transit_extension_requested=$${params.length}`);
      }
      if (transit_extension_granted !== undefined) {
        params.push(transit_extension_granted); updates.push(`transit_extension_granted=$${params.length}`);
      }
      if (transit_extension_days !== undefined) {
        params.push(transit_extension_days); updates.push(`transit_extension_days=$${params.length}`);
      }
      if (transit_extension_authority !== undefined) {
        params.push(transit_extension_authority); updates.push(`transit_extension_authority=$${params.length}`);
      }
      if (transit_extension_order_ref !== undefined) {
        params.push(transit_extension_order_ref); updates.push(`transit_extension_order_ref=$${params.length}`);
      }

      params.push(id);
      const result = await pool.query(
        `UPDATE transfer_records SET ${updates.join(', ')}, updated_at=NOW() WHERE id=$${params.length} RETURNING *`,
        params
      );

      await audit.log({
        userId: req.user.id, action: 'UPDATE', table: 'transfer_records',
        recordId: parseInt(id), before, after: result.rows[0]
      });

      return res.json({ success: true, data: result.rows[0] });
    }

    return res.status(400).json({ success: false, error: 'No valid update fields provided.' });
  } catch (err) { next(err); }
}

async function deleteTransfer(req, res, next) {
  try {
    const { id } = req.params;
    const record = (await pool.query('SELECT * FROM transfer_records WHERE id=$1', [id])).rows[0];
    if (!record) return res.status(404).json({ success: false, error: 'Not found.' });

    if (record.status === 'Completed') {
      return res.status(400).json({
        success: false,
        error: 'Completed transfers cannot be deleted — the staff record has already been updated. Cancel the transfer instead if needed.',
      });
    }

    await pool.query('DELETE FROM transfer_records WHERE id=$1', [id]);
    await audit.log({
      userId: req.user.id, action: 'DELETE', table: 'transfer_records',
      recordId: parseInt(id), before: record,
    });

    return res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { listTransfers, getTransfer, createTransfer, updateTransfer, deleteTransfer };
