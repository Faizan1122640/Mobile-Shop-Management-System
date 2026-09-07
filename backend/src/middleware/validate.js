import { AppError } from '../errors/AppError.js';

/**
 * Middleware factory for Zod Schema Validation
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      const firstMessage = formattedErrors[0]?.message || 'Validation failed';
      return res.status(422).json({
        success: false,
        status: 'fail',
        statusCode: 422,
        message: firstMessage,
        errors: formattedErrors
      });
    }

    // Attach sanitized, parsed data
    req.validatedBody = result.data;
    next();
  };
}
