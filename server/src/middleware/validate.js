import AppError from '../utils/AppError.js';

/**
 * Factory that creates an Express middleware for Zod schema validation.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Which part of the request to validate
 * @returns {Function} Express middleware
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return next(
        new AppError(
          `Validation failed: ${errors.map((e) => `${e.field} — ${e.message}`).join('; ')}`,
          400
        )
      );
    }

    // Replace with parsed (and possibly transformed/coerced) data
    req[source] = result.data;
    next();
  };
}

export default validate;
