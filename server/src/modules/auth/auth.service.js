import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';
import AppError from '../../utils/AppError.js';

const SALT_ROUNDS = 10;

/**
 * Authenticate user and return a JWT token.
 */
export async function login(username, password) {
  const result = await pool.query(
    'SELECT id, name, username, password_hash, language FROM users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid username or password.', 401);
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new AppError('Invalid username or password.', 401);
  }

  // Update last_login
  await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      language: user.language,
    },
  };
}

/**
 * Get user profile by ID.
 */
export async function getProfile(userId) {
  const result = await pool.query(
    'SELECT id, name, username, language, created_at, last_login FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  return result.rows[0];
}

/**
 * Update user profile (name, language, password).
 */
export async function updateProfile(userId, updates) {
  const { name, language, currentPassword, newPassword } = updates;

  // If changing password, verify current password first
  if (newPassword) {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found.', 404);
    }

    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      throw new AppError('Current password is incorrect.', 400);
    }
  }

  // Build dynamic update query
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (language !== undefined) {
    fields.push(`language = $${paramIndex++}`);
    values.push(language);
  }
  if (newPassword) {
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    fields.push(`password_hash = $${paramIndex++}`);
    values.push(hash);
  }

  if (fields.length === 0) {
    throw new AppError('No fields to update.', 400);
  }

  values.push(userId);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, name, username, language`,
    values
  );

  return result.rows[0];
}
