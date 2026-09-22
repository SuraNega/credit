import pool from '../../config/db.js';
import AppError from '../../utils/AppError.js';
import logActivity from '../../utils/logger.js';

/**
 * List customers with search, filter, and pagination.
 */
export async function listCustomers({ search, status, page, limit }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (status && status !== 'all') {
    conditions.push(`c.status = $${paramIndex++}`);
    values.push(status);
  }

  if (search) {
    const rawSearch = search.trim();
    const digitOnly = rawSearch.replace(/[\s\-\(\)\.]/g, '');
    let strippedPhone = digitOnly;
    if (strippedPhone.startsWith('+251')) strippedPhone = strippedPhone.slice(4);
    else if (strippedPhone.startsWith('251')) strippedPhone = strippedPhone.slice(3);
    else if (strippedPhone.startsWith('0')) strippedPhone = strippedPhone.slice(1);

    if (strippedPhone.length > 0 && /^\d+$/.test(strippedPhone)) {
      conditions.push(`(c.name ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex + 1})`);
      values.push(`%${rawSearch}%`);
      values.push(`%${strippedPhone}%`);
      paramIndex += 2;
    } else {
      conditions.push(`(c.name ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex})`);
      values.push(`%${rawSearch}%`);
      paramIndex++;
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM customers c ${whereClause}`,
    values
  );

  // Get customers with computed balance
  const dataValues = [...values, limit, offset];
  const result = await pool.query(
    `SELECT
       c.*,
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
     ${whereClause}
     ORDER BY c.name ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    dataValues
  );

  return {
    customers: result.rows,
    pagination: {
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    },
  };
}

/**
 * Get a single customer with their computed balance.
 */
export async function getCustomerById(customerId) {
  const result = await pool.query(
    `SELECT
       c.*,
       COALESCE(cr.total_credit, 0) AS total_credit,
       COALESCE(pa.total_paid, 0) AS total_paid,
       COALESCE(cr.total_credit, 0) - COALESCE(pa.total_paid, 0) AS balance
     FROM customers c
     LEFT JOIN (
       SELECT customer_id, SUM(amount) AS total_credit
       FROM credit_transactions
       WHERE customer_id = $1
       GROUP BY customer_id
     ) cr ON cr.customer_id = c.id
     LEFT JOIN (
       SELECT customer_id, SUM(amount_paid) AS total_paid
       FROM payments
       WHERE customer_id = $1
       GROUP BY customer_id
     ) pa ON pa.customer_id = c.id
     WHERE c.id = $1`,
    [customerId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  return result.rows[0];
}

/**
 * Create a new customer.
 */
export async function createCustomer(data, userId) {
  const { name, phone, block, house_number, language, notes } = data;

  const result = await pool.query(
    `INSERT INTO customers (name, phone, block, house_number, language, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, phone || null, block || null, house_number || null, language || 'am', notes || null]
  );

  const customer = result.rows[0];

  await logActivity(userId, 'CREATE_CUSTOMER', {
    customerId: customer.id,
    details: `Created customer: ${customer.name}`,
  });

  return customer;
}

/**
 * Update an existing customer.
 */
export async function updateCustomer(customerId, data, userId) {
  // Verify customer exists
  const existing = await pool.query('SELECT id, name FROM customers WHERE id = $1', [customerId]);
  if (existing.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = ['name', 'phone', 'block', 'house_number', 'language', 'notes'];

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
  values.push(customerId);

  const result = await pool.query(
    `UPDATE customers SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  await logActivity(userId, 'UPDATE_CUSTOMER', {
    customerId,
    details: `Updated customer: ${result.rows[0].name}`,
  });

  return result.rows[0];
}

/**
 * Update customer status (active/blacklisted).
 */
export async function updateCustomerStatus(customerId, status, blacklistReason, userId) {
  const existing = await pool.query('SELECT id, name, status FROM customers WHERE id = $1', [customerId]);
  if (existing.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  const result = await pool.query(
    `UPDATE customers
     SET status = $1, blacklist_reason = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, status === 'blacklisted' ? blacklistReason : null, customerId]
  );

  await logActivity(userId, status === 'blacklisted' ? 'BLACKLIST_CUSTOMER' : 'ACTIVATE_CUSTOMER', {
    customerId,
    details: `${status === 'blacklisted' ? 'Blacklisted' : 'Activated'} customer: ${result.rows[0].name}${blacklistReason ? ` — Reason: ${blacklistReason}` : ''}`,
  });

  return result.rows[0];
}

/**
 * Delete a customer.
 */
export async function deleteCustomer(customerId, userId) {
  const existing = await pool.query('SELECT id, name FROM customers WHERE id = $1', [customerId]);
  if (existing.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  await pool.query('DELETE FROM customers WHERE id = $1', [customerId]);

  await logActivity(userId, 'DELETE_CUSTOMER', {
    customerId,
    details: `Deleted customer: ${existing.rows[0].name}`,
  });

  return { message: 'Customer deleted successfully.' };
}
