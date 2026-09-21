import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

/**
 * JWT authentication middleware.
 * Extracts token from Authorization header, verifies it, and attaches user to req.
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request
    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please login again.', 401));
    }
    next(new AppError('Authentication failed.', 401));
  }
}

export default authenticate;
