import pool from '../../config/db.js';
import AppError from '../../utils/AppError.js';
import logActivity from '../../utils/logger.js';

/**
 * List all credit transactions for a customer.
 */
export async function listCredits(customerId) {
  // Verify customer exists
  const customer = await pool.query('SELECT id FROM customers WHERE id = $1', [customerId]);
  if (customer.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  const result = await pool.query(
    `SELECT
       ct.*,
       COALESCE(p.total_paid, 0) AS paid_amount,
       ct.amount - COALESCE(p.total_paid, 0) AS remaining
     FROM credit_transactions ct
     LEFT JOIN (
       SELECT credit_transaction_id, SUM(amount_paid) AS total_paid
       FROM payments
       WHERE credit_transaction_id IS NOT NULL
       GROUP BY credit_transaction_id
     ) p ON p.credit_transaction_id = ct.id
     WHERE ct.customer_id = $1
     ORDER BY ct.credit_date DESC`,
    [customerId]
  );

  return result.rows;
}

/**
 * Create a new credit transaction.
 */
export async function createCredit(customerId, data, userId) {
  // Verify customer exists and is active
  const customer = await pool.query('SELECT id, name, status FROM customers WHERE id = $1', [customerId]);
  if (customer.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }
  if (customer.rows[0].status === 'blacklisted') {
    throw new AppError('Cannot add credit for a blacklisted customer.', 400);
  }

  const { item, amount, credit_date, due_date, notes } = data;

  const result = await pool.query(
    `INSERT INTO credit_transactions (customer_id, item, amount, credit_date, due_date, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      customerId,
      item,
      amount,
      credit_date || new Date().toISOString(),
      due_date || null,
      notes || null,
      userId,
    ]
  );

  const credit = result.rows[0];

  await logActivity(userId, 'CREATE_CREDIT', {
    customerId,
    transactionId: credit.id,
    details: `Credit: ${item} — ${amount} ETB for ${customer.rows[0].name}`,
  });

  return credit;
}

/**
 * Update a credit transaction.
 */
export async function updateCredit(creditId, data, userId) {
  const existing = await pool.query(
    'SELECT ct.*, c.name AS customer_name FROM credit_transactions ct JOIN customers c ON c.id = ct.customer_id WHERE ct.id = $1',
    [creditId]
  );
  if (existing.rows.length === 0) {
    throw new AppError('Credit transaction not found.', 404);
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = ['item', 'amount', 'due_date', 'status', 'notes'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${paramIndex++}`);
      values.push(data[field]);
    }
  }

  if (fields.length === 0) {
    throw new AppError('No fields to update.', 400);
  }

  fields.push(`updated_at = NOW()`);
  values.push(creditId);

  const result = await pool.query(
    `UPDATE credit_transactions SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  await logActivity(userId, 'UPDATE_CREDIT', {
    customerId: existing.rows[0].customer_id,
    transactionId: creditId,
    details: `Updated credit #${creditId} for ${existing.rows[0].customer_name}`,
  });

  return result.rows[0];
}

/**
 * Delete a credit transaction.
 */
export async function deleteCredit(creditId, userId) {
  const existing = await pool.query(
    'SELECT ct.*, c.name AS customer_name FROM credit_transactions ct JOIN customers c ON c.id = ct.customer_id WHERE ct.id = $1',
    [creditId]
  );
  if (existing.rows.length === 0) {
    throw new AppError('Credit transaction not found.', 404);
  }

  await pool.query('DELETE FROM credit_transactions WHERE id = $1', [creditId]);

  await logActivity(userId, 'DELETE_CREDIT', {
    customerId: existing.rows[0].customer_id,
    transactionId: creditId,
    details: `Deleted credit: ${existing.rows[0].item} — ${existing.rows[0].amount} ETB for ${existing.rows[0].customer_name}`,
  });

  return { message: 'Credit transaction deleted successfully.' };
}

/**
 * Recalculate and update the status of a credit transaction based on payments.
 */
export async function recalculateCreditStatus(creditTransactionId) {
  if (!creditTransactionId) return;

  const credit = await pool.query(
    'SELECT amount FROM credit_transactions WHERE id = $1',
    [creditTransactionId]
  );
  if (credit.rows.length === 0) return;

  const payments = await pool.query(
    'SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM payments WHERE credit_transaction_id = $1',
    [creditTransactionId]
  );

  const totalPaid = parseFloat(payments.rows[0].total_paid);
  const creditAmount = parseFloat(credit.rows[0].amount);

  let newStatus;
  if (totalPaid >= creditAmount) {
    newStatus = 'paid';
  } else if (totalPaid > 0) {
    newStatus = 'partial';
  } else {
    newStatus = 'unpaid';
  }

  await pool.query(
    'UPDATE credit_transactions SET status = $1, updated_at = NOW() WHERE id = $2',
    [newStatus, creditTransactionId]
  );
}
