const pool = require('../models/db');

/**
 * Record a data mutation to the audit_log table.
 *
 * @param {object} opts
 * @param {number|null} opts.userId   - ID of the user performing the action
 * @param {string}      opts.action   - 'INSERT' | 'UPDATE' | 'DELETE'
 * @param {string}      opts.table    - Name of the table being mutated
 * @param {number|null} opts.recordId - PK of the affected row
 * @param {object|null} opts.before   - Row state before change (for UPDATE/DELETE)
 * @param {object|null} opts.after    - Row state after change (for INSERT/UPDATE)
 */
async function log({ userId = null, action, table, recordId = null, before = null, after = null }) {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, table, recordId, JSON.stringify({ before, after })]
    );
  } catch (err) {
    // Audit log failure must never crash the main operation
    console.error('Audit log error:', err.message);
  }
}

module.exports = { log };
