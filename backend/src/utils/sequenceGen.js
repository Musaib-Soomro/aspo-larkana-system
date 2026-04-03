const pool = require('../models/db');

/**
 * Generate next complaint number: COMP-YYYY-NNNN
 */
async function nextComplaintNumber(year) {
  const result = await pool.query(
    `SELECT COALESCE(MAX(
       CAST(SUBSTRING(complaint_number FROM LENGTH('COMP-' || $1 || '-') + 1) AS INTEGER)
     ), 0) + 1 AS next_seq
     FROM complaints
     WHERE complaint_number LIKE $2`,
    [String(year), `COMP-${year}-%`]
  );
  const seq = String(result.rows[0].next_seq).padStart(4, '0');
  return `COMP-${year}-${seq}`;
}

/**
 * Generate next inquiry number: INQ-YYYY-NNNN
 */
async function nextInquiryNumber(year) {
  const result = await pool.query(
    `SELECT COALESCE(MAX(
       CAST(SUBSTRING(inquiry_number FROM LENGTH('INQ-' || $1 || '-') + 1) AS INTEGER)
     ), 0) + 1 AS next_seq
     FROM inquiries
     WHERE inquiry_number LIKE $2`,
    [String(year), `INQ-${year}-%`]
  );
  const seq = String(result.rows[0].next_seq).padStart(4, '0');
  return `INQ-${year}-${seq}`;
}

module.exports = { nextComplaintNumber, nextInquiryNumber };
