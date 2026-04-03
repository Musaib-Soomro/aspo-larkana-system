const { formatDate } = require('../../utils/dateFormat');

/**
 * Returns the shared HTML letterhead used in all PDF documents.
 * @param {object} opts
 * @param {string} opts.officerName
 * @param {string} opts.officeTitle  - e.g. "ASPO Larkana Sub Division"
 * @param {string} opts.subjectCode  - Short subject code for file number
 * @param {string} opts.year         - 4-digit year
 * @param {string|Date} opts.date    - Reference date (defaults to today)
 */
function letterhead({ officerName, officeTitle, subjectCode, year, date }) {
  const displayDate = date ? formatDate(date) : formatDate(new Date());
  return `
    <div class="letterhead">
      <p class="center bold">OFFICE OF THE ASSISTANT SUPERINTENDENT POST OFFICES</p>
      <p class="center bold">LARKANA SUB DIVISION</p>
      <div class="letterhead-gap"></div>
      <p class="ref-line">
        No. AS-LRK/${subjectCode || '...'}/${year || new Date().getFullYear()}
        <span class="float-right">Dated at Larkana the ${displayDate}</span>
      </p>
    </div>
  `;
}

/**
 * Returns a complete HTML page string ready for Puppeteer.
 * @param {object} opts
 * @param {string} opts.body       - Inner HTML content
 * @param {boolean} opts.landscape - true for landscape orientation
 * @param {string} opts.extraCss   - Additional CSS to inject
 */
function wrapPage({ body, landscape = false, extraCss = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: A4 ${landscape ? 'landscape' : 'portrait'};
      margin: 20mm 20mm 20mm 20mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000;
      line-height: 1.4;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .letterhead { margin-bottom: 12pt; }
    .letterhead-gap { height: 8pt; }
    .ref-line { display: flex; justify-content: space-between; margin-bottom: 12pt; }
    .float-right { margin-left: auto; }
    table { width: 100%; border-collapse: collapse; margin: 8pt 0; }
    th, td { border: 1px solid #000; padding: 4pt 6pt; font-size: 11pt; }
    th { background: #f0f0f0; font-weight: bold; text-align: center; }
    td { text-align: left; }
    .signature-block { margin-top: 32pt; }
    .copy-line { margin-top: 16pt; font-size: 11pt; }
    p { margin-bottom: 6pt; }
    .page-break { page-break-before: always; }
    ${extraCss}
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
}

module.exports = { letterhead, wrapPage };
