import pool from '../../config/db.js';
import AppError from '../../utils/AppError.js';
import logActivity from '../../utils/logger.js';
import { recalculateCreditStatus } from '../credits/credits.service.js';

/**
 * List all payments for a customer.
 */
export async function listPayments(customerId) {
  // Verify customer exists
  const customer = await pool.query('SELECT id FROM customers WHERE id = $1', [customerId]);
  if (customer.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  const result = await pool.query(
    `SELECT
       p.*,
       ct.item AS credit_item,
       ct.amount AS credit_amount
     FROM payments p
     LEFT JOIN credit_transactions ct ON ct.id = p.credit_transaction_id
     WHERE p.customer_id = $1
     ORDER BY p.payment_date DESC`,
    [customerId]
  );

  return result.rows;
}

/**
 * Record a new payment.
 */
export async function createPayment(customerId, data, userId) {
  // Verify customer exists
  const customer = await pool.query('SELECT id, name FROM customers WHERE id = $1', [customerId]);
  if (customer.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  const { credit_transaction_id, amount_paid, payment_date, notes } = data;

  // If linked to a specific credit, verify it belongs to this customer
  if (credit_transaction_id) {
    const credit = await pool.query(
      'SELECT id, customer_id, item FROM credit_transactions WHERE id = $1',
      [credit_transaction_id]
    );
    if (credit.rows.length === 0) {
      throw new AppError('Credit transaction not found.', 404);
    }
    if (credit.rows[0].customer_id !== customerId) {
      throw new AppError('Credit transaction does not belong to this customer.', 400);
    }
  }

  const result = await pool.query(
    `INSERT INTO payments (customer_id, credit_transaction_id, amount_paid, payment_date, notes, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      customerId,
      credit_transaction_id || null,
      amount_paid,
      payment_date || new Date().toISOString(),
      notes || null,
      userId,
    ]
  );

  const payment = result.rows[0];

  // Auto-recalculate linked credit transaction status
  if (credit_transaction_id) {
    await recalculateCreditStatus(credit_transaction_id);
  }

  await logActivity(userId, 'RECORD_PAYMENT', {
    customerId,
    transactionId: credit_transaction_id || null,
    details: `Payment of ${amount_paid} ETB from ${customer.rows[0].name}`,
  });

  return payment;
}

/**
 * Delete a payment.
 */
export async function deletePayment(paymentId, userId) {
  const existing = await pool.query(
    `SELECT p.*, c.name AS customer_name
     FROM payments p
     JOIN customers c ON c.id = p.customer_id
     WHERE p.id = $1`,
    [paymentId]
  );
  if (existing.rows.length === 0) {
    throw new AppError('Payment not found.', 404);
  }

  const payment = existing.rows[0];

  await pool.query('DELETE FROM payments WHERE id = $1', [paymentId]);

  // Recalculate linked credit transaction status after deletion
  if (payment.credit_transaction_id) {
    await recalculateCreditStatus(payment.credit_transaction_id);
  }

  await logActivity(userId, 'DELETE_PAYMENT', {
    customerId: payment.customer_id,
    transactionId: payment.credit_transaction_id,
    details: `Deleted payment of ${payment.amount_paid} ETB from ${payment.customer_name}`,
  });

  return { message: 'Payment deleted successfully.' };
}
