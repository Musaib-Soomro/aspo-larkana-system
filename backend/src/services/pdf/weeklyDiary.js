const pool = require('../../models/db');
const { letterhead, wrapPage } = require('./pdfBase');
const { formatDate, monthName } = require('../../utils/dateFormat');

async function generateWeeklyDiary({ week_number, month, year, start_date, end_date }) {
  // Fetch settings
  const settingsResult = await pool.query('SELECT key, value FROM settings');
  const settings = {};
  for (const row of settingsResult.rows) settings[row.key] = row.value;

  const officerName = settings.officer_name || 'ASPO';

  // Fetch visits in date range
  const visitsResult = await pool.query(
    `SELECT iv.*, ip.office_id, o.name AS office_name,
            ip.allotted_month
     FROM inspection_visits iv
     JOIN inspection_programme ip ON ip.id = iv.programme_id
     JOIN offices o ON o.id = ip.office_id
     WHERE iv.visit_date BETWEEN $1 AND $2
     ORDER BY iv.visit_date`,
    [start_date, end_date]
  );

  const visits = visitsResult.rows;

  // Build movement table rows
  const movementRows = visits.map((v) => `
    <tr>
      <td>Larkana</td>
      <td>${formatDate(v.visit_date)}</td>
      <td>${v.departure_time || '-'}</td>
      <td>${v.office_name}</td>
      <td>${formatDate(v.visit_date)}</td>
      <td>${v.return_time || '-'}</td>
      <td>${v.distance_km || '-'}</td>
      <td>${v.day_type || '-'}</td>
    </tr>
  `).join('');

  // Build daily narrative
  const start = new Date(start_date);
  const end = new Date(end_date);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let dailyNarrative = '';
  const cur = new Date(start);

  while (cur <= end) {
    const dateStr = formatDate(cur);
    const dayName = dayNames[cur.getDay()];
    const dayVisits = visits.filter((v) => {
      const vd = new Date(v.visit_date);
      return vd.toDateString() === cur.toDateString();
    });

    let narrative;
    if (cur.getDay() === 0) {
      narrative = 'Availed the holiday.';
    } else if (dayVisits.length > 0) {
      const officeNames = [...new Set(dayVisits.map((v) => v.office_name))].join(', ');
      narrative = `Attended office in the morning. Proceeded to inspect ${officeNames}. Returned to Larkana in the evening.`;
    } else {
      narrative = 'Attended office and performed official duties.';
    }

    dailyNarrative += `<p><strong>${dateStr} (${dayName}):</strong> ${narrative}</p>`;
    cur.setDate(cur.getDate() + 1);
  }

  const body = `
    ${letterhead({ officerName, subjectCode: 'W.Diary', year, date: end_date })}

    <p class="center bold" style="margin: 12pt 0;">
      WEEKLY DIARY OF ASSISTANT SUPERINTENDENT POST OFFICES LARKANA SUB DIVISION<br/>
      FOR THE ${week_number}${ordinal(week_number)} WEEK OF ${monthName(month)}-${year}
    </p>

    <p class="bold">MOVEMENT TABLE:</p>
    <table>
      <thead>
        <tr>
          <th>From Station</th><th>Date</th><th>Departure</th>
          <th>To Station</th><th>Date</th><th>Return</th>
          <th>Distance (km)</th><th>Day Type</th>
        </tr>
      </thead>
      <tbody>
        ${movementRows || '<tr><td colspan="8" style="text-align:center">No visits recorded</td></tr>'}
      </tbody>
    </table>

    <p class="bold" style="margin-top: 12pt;">DAILY NARRATIVE:</p>
    ${dailyNarrative}

    <div class="copy-line">
      <p>Copy submitted to: The Divisional Superintendent Postal Services Larkana.</p>
    </div>

    <div class="signature-block">
      <p>(${officerName})</p>
      <p>Assistant Superintendent Post Offices</p>
      <p>Larkana Sub-Division</p>
    </div>
  `;

  return wrapPage({ body });
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

module.exports = { generateWeeklyDiary };
