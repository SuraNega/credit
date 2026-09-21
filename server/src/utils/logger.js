import pool from '../config/db.js';

/**
 * Log an activity to the activity_log table.
 *
 * @param {number} userId - The user performing the action
 * @param {string} action - Action type (e.g., CREATE_CUSTOMER, RECORD_PAYMENT)
 * @param {object} options
 * @param {number|null} options.customerId - Related customer ID
 * @param {number|null} options.transactionId - Related credit transaction ID
 * @param {string|null} options.details - Human-readable description
 */
export async function logActivity(userId, action, { customerId = null, transactionId = null, details = null } = {}) {
  try {
    await pool.query(
      `INSERT INTO activity_log (user_id, action, customer_id, transaction_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, customerId, transactionId, details]
    );
  } catch (err) {
    // Don't let logging failures crash the request — just warn
    console.error('⚠️ Failed to log activity:', err.message);
  }
}

export default logActivity;
