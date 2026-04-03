const pool = require('../models/db');

async function getSummary(req, res, next) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentHalf = currentMonth <= 6 ? 'First' : 'Second';

    const [
      staffOnLeave,
      lookafterActive,
      activeComplaints,
      pendingInquiries,
      inspectionsDue,
      inspectionsOverdue,
      revenueStatus,
    ] = await Promise.all([
      pool.query(
        `SELECT s.id, s.full_name, s.designation, o.name AS office_name,
                lr.leave_type, lr.start_date, lr.end_date
         FROM staff s
         JOIN offices o ON o.id = s.office_id
         JOIN leave_records lr ON lr.staff_id = s.id AND lr.status = 'Active'
         WHERE s.is_on_leave = true AND s.is_active = true
         ORDER BY lr.start_date`
      ),
      pool.query(
        `SELECT s.id, s.full_name, s.designation,
                o.name AS home_office, lo.name AS covering_office
         FROM staff s
         JOIN offices o ON o.id = s.office_id
         JOIN offices lo ON lo.id = s.lookafter_office_id
         WHERE s.is_on_lookafter = true AND s.is_active = true`
      ),
      pool.query(`SELECT COUNT(*) FROM complaints WHERE status != 'Closed'`),
      pool.query(`SELECT COUNT(*) FROM inquiries WHERE status NOT IN ('Closed', 'Report Submitted')`),
      pool.query(
        `SELECT ip.id, ip.allotted_month, o.name AS office_name, ip.inspecting_officer
         FROM inspection_programme ip
         JOIN offices o ON o.id = ip.office_id
         WHERE ip.allotted_month = $1 AND ip.year = $2 AND ip.status = 'Pending'
         ORDER BY o.name`,
        [currentMonth, currentYear]
      ),
      pool.query(
        `SELECT ip.id, ip.allotted_month, o.name AS office_name
         FROM inspection_programme ip
         JOIN offices o ON o.id = ip.office_id
         WHERE ip.allotted_month < $1 AND ip.year = $2 AND ip.half = $3 AND ip.status = 'Pending'
         ORDER BY ip.allotted_month, o.name`,
        [currentMonth, currentYear, currentHalf]
      ),
      pool.query(
        `SELECT o.id, o.name, re.id AS entry_id, re.is_draft
         FROM offices o
         LEFT JOIN revenue_entries re ON re.office_id = o.id AND re.month = $1 AND re.year = $2
         WHERE o.is_active = true
         ORDER BY o.name`,
        [currentMonth, currentYear]
      ),
    ]);

    const allOffices = revenueStatus.rows;
    const revenuePending = allOffices.filter((r) => !r.entry_id || r.is_draft);
    const revenueSubmitted = allOffices.filter((r) => r.entry_id && !r.is_draft);

    // Days remaining in current month
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const daysRemaining = lastDay - now.getDate();

    return res.json({
      success: true,
      data: {
        staff_on_leave: staffOnLeave.rows,
        lookafter_active: lookafterActive.rows,
        active_complaints_count: parseInt(activeComplaints.rows[0].count, 10),
        pending_inquiries_count: parseInt(pendingInquiries.rows[0].count, 10),
        inspections_due_this_month: inspectionsDue.rows,
        inspections_overdue: inspectionsOverdue.rows,
        revenue_pending_offices: revenuePending,
        revenue_submitted_offices: revenueSubmitted,
        current_month: currentMonth,
        current_year: currentYear,
        days_remaining_in_month: daysRemaining,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getPostmasterSummary(req, res, next) {
  try {
    const officeId = req.user.office_id;
    if (!officeId) return res.status(403).json({ success: false, error: 'No office assigned to your account.' });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const today = now.toISOString().split('T')[0];

    const [
      officeResult,
      leaveResult,
      monthlyRevenue,
      yearlyRevenue,
      todayArticles,
      depositArticles,
    ] = await Promise.all([
      // Office info
      pool.query('SELECT id, name, tehsil, type, shift FROM offices WHERE id = $1', [officeId]),

      // Leave balance for this postmaster's staff member (matched by office)
      pool.query(
        `SELECT lr.leave_type, COUNT(*) AS days_taken
         FROM leave_records lr
         JOIN staff s ON s.id = lr.staff_id
         WHERE s.office_id = $1 AND s.is_active = true
           AND lr.status IN ('Active', 'Completed')
           AND EXTRACT(YEAR FROM lr.start_date) = $2
         GROUP BY lr.leave_type`,
        [officeId, currentYear]
      ),

      // Monthly revenue entry status
      pool.query(
        `SELECT re.id, re.is_draft, re.submitted_by, re.updated_at,
                COALESCE(SUM(rd.value) FILTER (WHERE rd.unit = 'amount'), 0) AS total_amount
         FROM revenue_entries re
         LEFT JOIN revenue_data rd ON rd.entry_id = re.id
         WHERE re.office_id = $1 AND re.month = $2 AND re.year = $3
         GROUP BY re.id`,
        [officeId, currentMonth, currentYear]
      ),

      // Yearly revenue total (submitted only)
      pool.query(
        `SELECT COALESCE(SUM(rd.value), 0) AS yearly_total
         FROM revenue_data rd
         JOIN revenue_entries re ON re.id = rd.entry_id
         WHERE re.office_id = $1 AND re.year = $2 AND re.is_draft = false AND rd.unit = 'amount'`,
        [officeId, currentYear]
      ),

      // Today's article register status
      pool.query(
        `SELECT article_type, in_deposit, received, delivered, returned
         FROM daily_articles
         WHERE office_id = $1 AND record_date = $2`,
        [officeId, today]
      ),

      // Total articles currently in deposit (latest entry per type)
      pool.query(
        `SELECT da.article_type,
                da.in_deposit + da.received - da.delivered - da.returned AS closing
         FROM daily_articles da
         WHERE da.office_id = $1
           AND da.record_date = (
             SELECT MAX(record_date) FROM daily_articles WHERE office_id = $1
           )`,
        [officeId]
      ),
    ]);

    const office = officeResult.rows[0];

    // Leave limits
    const LEAVE_LIMITS = { CL: 20, EL: 30, Medical: 30, Special: 10 };
    const leaveMap = {};
    leaveResult.rows.forEach((r) => {
      leaveMap[r.leave_type] = parseInt(r.days_taken, 10);
    });
    const leaveBalance = Object.entries(LEAVE_LIMITS).map(([type, limit]) => ({
      type,
      limit,
      used: leaveMap[type] || 0,
      remaining: limit - (leaveMap[type] || 0),
    }));

    // Monthly revenue
    const monthEntry = monthlyRevenue.rows[0] || null;

    // Yearly total
    const yearlyTotal = parseFloat(yearlyRevenue.rows[0]?.yearly_total || 0);

    // Today's register
    const todayFilled = todayArticles.rows.length > 0;
    const todayTotals = todayArticles.rows.reduce(
      (acc, r) => ({
        received: acc.received + r.received,
        delivered: acc.delivered + r.delivered,
        in_deposit: acc.in_deposit + r.in_deposit,
      }),
      { received: 0, delivered: 0, in_deposit: 0 }
    );

    // Pending articles (closing balance)
    const pendingArticles = depositArticles.rows
      .filter((r) => r.closing > 0)
      .map((r) => ({ type: r.article_type, count: parseInt(r.closing, 10) }));
    const totalPending = pendingArticles.reduce((s, r) => s + r.count, 0);

    return res.json({
      success: true,
      data: {
        office,
        leave_balance: leaveBalance,
        monthly_revenue: monthEntry
          ? { submitted: !monthEntry.is_draft, amount: parseFloat(monthEntry.total_amount), updated_at: monthEntry.updated_at }
          : null,
        yearly_revenue_total: yearlyTotal,
        current_month: currentMonth,
        current_year: currentYear,
        today,
        today_register_filled: todayFilled,
        today_totals: todayTotals,
        pending_articles: pendingArticles,
        total_pending_articles: totalPending,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getPostmasterSummary };
