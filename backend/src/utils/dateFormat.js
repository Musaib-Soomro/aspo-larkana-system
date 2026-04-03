/**
 * Format a Date or ISO string to DD-MM-YYYY (Pakistani standard display format).
 */
function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Return today's date as DD-MM-YYYY.
 */
function today() {
  return formatDate(new Date());
}

/**
 * Return today as YYYY-MM-DD (ISO, for DB storage).
 */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get full month name from month number (1-12).
 */
const MONTHS = [
  '', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

function monthName(monthNumber) {
  return MONTHS[parseInt(monthNumber, 10)] || '';
}

module.exports = { formatDate, today, todayISO, monthName, MONTHS };
