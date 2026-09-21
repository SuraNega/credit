/**
 * Global error handling middleware.
 * Catches all errors and returns a consistent JSON response.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  // Log non-operational errors (unexpected bugs)
  if (!err.isOperational) {
    console.error('💥 Unexpected Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
}

export default errorHandler;
