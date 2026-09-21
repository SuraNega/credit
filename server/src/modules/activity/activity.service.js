import pool from '../../config/db.js';
import AppError from '../../utils/AppError.js';

/**
 * List recent activity entries with pagination.
 */
export async function listActivity({ page = 1, limit = 30 }) {
  const offset = (page - 1) * limit;

  const countResult = await pool.query('SELECT COUNT(*) FROM activity_log');

  const result = await pool.query(
    `SELECT
       al.*,
       u.name AS user_name,
       c.name AS customer_name
     FROM activity_log al
     LEFT JOIN users u ON u.id = al.user_id
     LEFT JOIN customers c ON c.id = al.customer_id
     ORDER BY al.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    activities: result.rows,
    pagination: {
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    },
  };
}

/**
 * List activity for a specific customer.
 */
export async function listCustomerActivity(customerId) {
  // Verify customer exists
  const customer = await pool.query('SELECT id FROM customers WHERE id = $1', [customerId]);
  if (customer.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  const result = await pool.query(
    `SELECT
       al.*,
       u.name AS user_name
     FROM activity_log al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.customer_id = $1
     ORDER BY al.created_at DESC
     LIMIT 100`,
    [customerId]
  );

  return result.rows;
}

/**
 * Get dashboard summary stats.
 */
export async function getDashboardSummary() {
  // Total customers
  const customersResult = await pool.query(
    `SELECT
       COUNT(*) AS total_customers,
       COUNT(*) FILTER (WHERE status = 'active') AS active_customers,
       COUNT(*) FILTER (WHERE status = 'blacklisted') AS blacklisted_customers
     FROM customers`
  );

  // Total outstanding balance
  const balanceResult = await pool.query(
    `SELECT
       COALESCE(SUM(cr.amount), 0) AS total_credit,
       COALESCE(SUM(pa.total_paid), 0) AS total_paid,
       COALESCE(SUM(cr.amount), 0) - COALESCE(SUM(pa.total_paid), 0) AS total_outstanding
     FROM credit_transactions cr
     LEFT JOIN (
       SELECT credit_transaction_id, SUM(amount_paid) AS total_paid
       FROM payments
       WHERE credit_transaction_id IS NOT NULL
       GROUP BY credit_transaction_id
     ) pa ON pa.credit_transaction_id = cr.id`
  );

  // Overdue credits (past due_date and not paid)
  const overdueResult = await pool.query(
    `SELECT COUNT(*) AS overdue_count
     FROM credit_transactions
     WHERE due_date < NOW() AND status != 'paid'`
  );

  // Credits breakdown
  const creditsBreakdown = await pool.query(
    `SELECT
       COUNT(*) AS total_credits,
       COUNT(*) FILTER (WHERE status = 'unpaid') AS unpaid,
       COUNT(*) FILTER (WHERE status = 'partial') AS partial,
       COUNT(*) FILTER (WHERE status = 'paid') AS paid
     FROM credit_transactions`
  );

  return {
    customers: customersResult.rows[0],
    balance: balanceResult.rows[0],
    overdue_count: parseInt(overdueResult.rows[0].overdue_count),
    credits: creditsBreakdown.rows[0],
  };
}

/**
 * Get top N customers by outstanding balance.
 */
export async function getTopDebtors(limit = 10) {
  const result = await pool.query(
    `SELECT
       c.id,
       c.name,
       c.phone,
       c.status,
       COALESCE(cr.total_credit, 0) AS total_credit,
       COALESCE(pa.total_paid, 0) AS total_paid,
       COALESCE(cr.total_credit, 0) - COALESCE(pa.total_paid, 0) AS balance
     FROM customers c
     LEFT JOIN (
       SELECT customer_id, SUM(amount) AS total_credit
       FROM credit_transactions
       GROUP BY customer_id
     ) cr ON cr.customer_id = c.id
     LEFT JOIN (
       SELECT customer_id, SUM(amount_paid) AS total_paid
       FROM payments
       GROUP BY customer_id
     ) pa ON pa.customer_id = c.id
     WHERE COALESCE(cr.total_credit, 0) - COALESCE(pa.total_paid, 0) > 0
     ORDER BY balance DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}
