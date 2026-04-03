const pool = require('../models/db');
const audit = require('../services/auditLog');

// GET /attendance?month=3&year=2026&office_id=1
// Returns all staff for that office with a day-keyed attendance map for the month
async function getMonthlyRegister(req, res, next) {
  try {
    const { month, year, office_id } = req.query;
    if (!month || !year || !office_id) {
      return res.status(400).json({ success: false, error: 'month, year, and office_id are required.' });
    }

    const m = parseInt(month);
    const y = parseInt(year);
    const oid = parseInt(office_id);

    // All active staff at that office
    const staffResult = await pool.query(
      `SELECT id, full_name, designation FROM staff WHERE office_id = $1 AND is_active = true ORDER BY designation, full_name`,
      [oid]
    );

    if (staffResult.rows.length === 0) {
      return res.json({ success: true, data: { staff: [], month: m, year: y } });
    }

    const staffIds = staffResult.rows.map(s => s.id);

    // All attendance records for these staff for this month
    const attResult = await pool.query(
      `SELECT staff_id, date, status, leave_id, notes
       FROM attendance_records
       WHERE staff_id = ANY($1)
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR FROM date) = $3`,
      [staffIds, m, y]
    );

    // Build map: staffId → { 'YYYY-MM-DD': { status, leave_id, notes } }
    const attMap = {};
    for (const row of attResult.rows) {
      if (!attMap[row.staff_id]) attMap[row.staff_id] = {};
      const dateStr = row.date.toISOString().split('T')[0];
      attMap[row.staff_id][dateStr] = { status: row.status, leave_id: row.leave_id, notes: row.notes };
    }

    const staffWithDays = staffResult.rows.map(s => ({
      id: s.id,
      full_name: s.full_name,
      designation: s.designation,
      days: attMap[s.id] || {},
    }));

    return res.json({ success: true, data: { staff: staffWithDays, month: m, year: y } });
  } catch (err) { next(err); }
}

// POST /attendance — mark or upsert attendance for one staff+date
async function markAttendance(req, res, next) {
  try {
    const { staff_id, date, status, leave_id, notes } = req.body;

    if (!staff_id || !date || !status) {
      return res.status(400).json({ success: false, error: 'staff_id, date, and status are required.' });
    }

    // If On Leave, validate leave_id covers the date
    if (status === 'On Leave') {
      if (!leave_id) {
        return res.status(400).json({ success: false, error: 'leave_id is required when status is On Leave.' });
      }
      const leave = (await pool.query(
        'SELECT start_date, end_date FROM leave_records WHERE id=$1 AND staff_id=$2',
        [leave_id, staff_id]
      )).rows[0];
      if (!leave) return res.status(400).json({ success: false, error: 'Leave record not found for this staff member.' });
      const d = new Date(date);
      if (d < new Date(leave.start_date) || d > new Date(leave.end_date)) {
        return res.status(400).json({ success: false, error: 'Date is outside the leave record period.' });
      }
    }

    const before = (await pool.query(
      'SELECT * FROM attendance_records WHERE staff_id=$1 AND date=$2', [staff_id, date]
    )).rows[0];

    const result = await pool.query(
      `INSERT INTO attendance_records (staff_id, date, status, leave_id, notes)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (staff_id, date) DO UPDATE
         SET status=$3, leave_id=$4, notes=$5, updated_at=NOW()
       RETURNING *`,
      [staff_id, date, status, leave_id || null, notes || null]
    );

    await audit.log({
      userId: req.user.id,
      action: before ? 'UPDATE' : 'INSERT',
      table: 'attendance_records',
      recordId: result.rows[0].id,
      before: before || null,
      after: result.rows[0],
    });

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

// GET /attendance/report?staff_id=1&month=3&year=2026
// month optional — omit for full-year report
async function getAttendanceReport(req, res, next) {
  try {
    const { staff_id, month, year } = req.query;
    if (!staff_id || !year) {
      return res.status(400).json({ success: false, error: 'staff_id and year are required.' });
    }

    const conditions = ['staff_id=$1', 'EXTRACT(YEAR FROM date)=$2'];
    const params = [parseInt(staff_id), parseInt(year)];

    if (month) {
      params.push(parseInt(month));
      conditions.push(`EXTRACT(MONTH FROM date)=$${params.length}`);
    }

    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status='Present')   AS present,
         COUNT(*) FILTER (WHERE status='Absent')    AS absent,
         COUNT(*) FILTER (WHERE status='On Leave')  AS on_leave,
         COUNT(*) FILTER (WHERE status='On Duty')   AS on_duty,
         COUNT(*) FILTER (WHERE status='Holiday')   AS holidays,
         COUNT(*) AS total_marked
       FROM attendance_records
       WHERE ${conditions.join(' AND ')}`,
      params
    );

    const row = result.rows[0];
    const present = parseInt(row.present);
    const absent  = parseInt(row.absent);
    const on_leave = parseInt(row.on_leave);
    const on_duty  = parseInt(row.on_duty);
    const holidays = parseInt(row.holidays);
    const total    = parseInt(row.total_marked);
    const working_days = present + absent + on_leave + on_duty;
    const attendance_pct = working_days > 0
      ? Math.round(((present + on_duty) / working_days) * 100)
      : 0;

    // Leave records for the period
    const leaveParams = [parseInt(staff_id), parseInt(year)];
    let leaveCond = 'staff_id=$1 AND EXTRACT(YEAR FROM start_date)=$2';
    if (month) {
      leaveParams.push(parseInt(month));
      leaveCond += ` AND EXTRACT(MONTH FROM start_date)=$${leaveParams.length}`;
    }
    const leaves = await pool.query(
      `SELECT id, leave_type, start_date, end_date, total_days, dsps_memo_no, dsps_memo_date, approved_by
       FROM leave_records WHERE ${leaveCond} ORDER BY start_date`,
      leaveParams
    );

    return res.json({
      success: true,
      data: {
        present, absent, on_leave, on_duty, holidays,
        working_days, attendance_pct, total_marked: total,
        leave_records: leaves.rows,
      }
    });
  } catch (err) { next(err); }
}

// POST /attendance/leave-memo — register a DSPS memo leave for ASPO office staff
async function createLeaveMemo(req, res, next) {
  try {
    const { staff_id, dsps_memo_no, dsps_memo_date, leave_type, start_date, end_date, notes } = req.body;

    if (!staff_id || !dsps_memo_no || !dsps_memo_date || !leave_type || !start_date || !end_date) {
      return res.status(400).json({ success: false, error: 'staff_id, dsps_memo_no, dsps_memo_date, leave_type, start_date, end_date are required.' });
    }

    const start = new Date(start_date);
    const end   = new Date(end_date);
    if (end < start) return res.status(400).json({ success: false, error: 'end_date must be on or after start_date.' });

    const total_days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const result = await pool.query(
      `INSERT INTO leave_records
         (staff_id, leave_type, start_date, end_date, total_days, approved_by, status, dsps_memo_no, dsps_memo_date, reason)
       VALUES ($1,$2,$3,$4,$5,'DSPS Larkana','Active',$6,$7,$8)
       RETURNING *`,
      [staff_id, leave_type, start_date, end_date, total_days, dsps_memo_no, dsps_memo_date, notes || null]
    );

    await audit.log({
      userId: req.user.id, action: 'INSERT', table: 'leave_records',
      recordId: result.rows[0].id, after: result.rows[0]
    });

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

// GET /attendance/leave-memos?staff_id=1 — list leave memos for a staff member (for attendance linking)
async function listLeaveMemos(req, res, next) {
  try {
    const { staff_id } = req.query;
    if (!staff_id) return res.status(400).json({ success: false, error: 'staff_id is required.' });

    const result = await pool.query(
      `SELECT id, leave_type, start_date, end_date, total_days, dsps_memo_no, dsps_memo_date, status
       FROM leave_records
       WHERE staff_id=$1 AND dsps_memo_no IS NOT NULL
       ORDER BY start_date DESC`,
      [parseInt(staff_id)]
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

module.exports = { getMonthlyRegister, markAttendance, getAttendanceReport, createLeaveMemo, listLeaveMemos };
