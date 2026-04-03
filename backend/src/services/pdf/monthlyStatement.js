const pool = require('../../models/db');
const { letterhead, wrapPage } = require('./pdfBase');
const { formatDate, monthName } = require('../../utils/dateFormat');

async function generateMonthlyStatement({ month, year, reference_date }) {
  const settingsResult = await pool.query('SELECT key, value FROM settings');
  const settings = {};
  for (const row of settingsResult.rows) settings[row.key] = row.value;

  // Fetch all completed inspections this month
  const completedResult = await pool.query(
    `SELECT ip.*, o.name AS office_name, o.type AS office_type
     FROM inspection_programme ip
     JOIN offices o ON o.id = ip.office_id
     WHERE ip.allotted_month = $1 AND ip.year = $2 AND ip.status = 'Completed'
     ORDER BY ip.completed_date, o.name`,
    [month, year]
  );

  // Cumulative done this half
  const currentHalf = parseInt(month, 10) <= 6 ? 'First' : 'Second';
  const cumulativeResult = await pool.query(
    `SELECT COUNT(*) AS done FROM inspection_programme
     WHERE year = $1 AND half = $2 AND status = 'Completed'`,
    [year, currentHalf]
  );

  // Allotted total this half
  const allottedResult = await pool.query(
    `SELECT COUNT(*) AS allotted FROM inspection_programme
     WHERE year = $1 AND half = $2`,
    [year, currentHalf]
  );

  const allotted = parseInt(allottedResult.rows[0].allotted, 10);
  const totalDone = parseInt(cumulativeResult.rows[0].done, 10);
  const doneThisMonth = completedResult.rows.length;
  const remaining = allotted - totalDone;

  // Build numbered list of offices inspected this month
  const officeList = completedResult.rows.map((r, i) =>
    `<li>${i + 1}. ${r.office_name} — ${formatDate(r.completed_date)}</li>`
  ).join('');

  const body = `
    ${letterhead({ subjectCode: 'M.Stt/Inspection-Work', year, date: reference_date })}

    <p class="center bold" style="margin: 12pt 0;">
      MONTHLY STATEMENT SHOWING THE INSPECTION WORK DONE<br/>
      DURING THE MONTH OF ${monthName(month)}-${year}
    </p>

    <table>
      <thead>
        <tr>
          <th>Designation</th>
          <th>SOs Allotted (Half)</th>
          <th>SOs Done (Last Month)</th>
          <th>SOs Allotted (This Month)</th>
          <th>SOs Done (This Month)</th>
          <th>Total Done</th>
          <th>Remaining</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ASPO Larkana</td>
          <td style="text-align:center">${allotted}</td>
          <td style="text-align:center">${totalDone - doneThisMonth}</td>
          <td style="text-align:center">${doneThisMonth}</td>
          <td style="text-align:center">${doneThisMonth}</td>
          <td style="text-align:center">${totalDone}</td>
          <td style="text-align:center">${remaining}</td>
        </tr>
      </tbody>
    </table>

    <p class="bold" style="margin-top: 12pt;">Offices Inspected This Month:</p>
    <ol style="margin-left: 20pt; margin-top: 6pt;">
      ${officeList || '<li>None</li>'}
    </ol>

    <div class="copy-line">
      <p>Copy Submitted to: The Divisional Superintendent Postal Services Larkana.</p>
    </div>

    <div class="signature-block">
      <p>(${settings.officer_name || 'ASPO'})</p>
      <p>Assistant Superintendent Post Offices</p>
      <p>Larkana Sub-Division</p>
    </div>
  `;

  return wrapPage({ body, landscape: true });
}

module.exports = { generateMonthlyStatement };
