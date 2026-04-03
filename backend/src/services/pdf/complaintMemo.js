const pool = require('../../models/db');
const { letterhead, wrapPage } = require('./pdfBase');
const { formatDate } = require('../../utils/dateFormat');

async function generateComplaintMemo({ complaint_id, memo_subject_code, reference_date }) {
  const settingsResult = await pool.query('SELECT key, value FROM settings');
  const settings = {};
  for (const row of settingsResult.rows) settings[row.key] = row.value;

  const cResult = await pool.query(
    `SELECT c.*, o.name AS office_name FROM complaints c
     LEFT JOIN offices o ON o.id = c.office_id WHERE c.id = $1`,
    [complaint_id]
  );
  if (!cResult.rows[0]) throw Object.assign(new Error('Complaint not found.'), { status: 404, expose: true });

  const c = cResult.rows[0];
  const subjectCode = memo_subject_code || c.memo_subject_code || 'Complaint';
  const year = new Date().getFullYear();

  const body = `
    ${letterhead({ subjectCode, year, date: reference_date || new Date() })}

    <p><strong>To,</strong><br/>
    The Divisional Superintendent Postal Services,<br/>
    Larkana.</p>

    <p style="margin-top: 12pt;"><strong>Subject: Preliminary Inquiry Report — Complaint No. ${c.complaint_number}</strong></p>

    <p>Sir,</p>

    <p>I beg to submit the following Preliminary Inquiry Report in reference to the complaint
    received on <strong>${formatDate(c.date_received)}</strong> via <strong>${c.source}</strong>
    from <strong>${c.complainant_name}</strong>${c.complainant_contact ? ' (' + c.complainant_contact + ')' : ''}
    regarding <strong>${c.office_name || 'the concerned office'}</strong>.</p>

    <p><strong>Details of Complaint:</strong></p>
    <table>
      <tr><th style="width:35%">Complaint Number</th><td>${c.complaint_number}</td></tr>
      <tr><th>Article Number</th><td>${c.article_number || 'Not specified'}</td></tr>
      <tr><th>Article Type</th><td>${c.article_type}</td></tr>
      <tr><th>Office Concerned</th><td>${c.office_name || 'N/A'}</td></tr>
      <tr><th>Complainant</th><td>${c.complainant_name}</td></tr>
      <tr><th>Date of Complaint</th><td>${formatDate(c.date_received)}</td></tr>
    </table>

    <p style="margin-top: 12pt;"><strong>Description:</strong></p>
    <p>${c.complaint_description}</p>

    ${c.proof_of_delivery_notes ? `<p><strong>Proof of Delivery / Findings:</strong></p><p>${c.proof_of_delivery_notes}</p>` : ''}

    <p style="margin-top: 12pt;"><strong>Recommendation:</strong></p>
    <p>${c.resolution_notes || 'Under investigation. Further inquiry in progress.'}</p>

    <p>This is submitted for your kind information and further necessary action.</p>

    <div class="signature-block">
      <p>Yours obediently,</p>
      <br/>
      <p>(${settings.officer_name || 'ASPO'})</p>
      <p>Assistant Superintendent Post Offices</p>
      <p>Larkana Sub-Division</p>
    </div>
  `;

  return wrapPage({ body });
}

module.exports = { generateComplaintMemo };
