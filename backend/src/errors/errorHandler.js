import { ZodError } from 'zod';
import { AppError } from './AppError.js';

/**
 * Formats Zod validation issues into an easy-to-consume array of errors
 */
const formatZodError = (err) => {
  const errors = err.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code
  }));

  return new AppError('Validation failed on incoming request payload', 400, errors);
};

/**
 * Global Express Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Transform ZodError into operational AppError
  if (err instanceof ZodError) {
    error = formatZodError(err);
  }

  // Ensure standard defaults if not already an AppError
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  const isDev = process.env.NODE_ENV !== 'production';

  // Structured response JSON
  const responsePayload = {
    success: false,
    status: error.status,
    statusCode: error.statusCode,
    message: error.message || 'An unexpected error occurred on the server'
  };

  if (error.details) {
    responsePayload.errors = error.details;
  }

  if (isDev && error.stack) {
    responsePayload.stack = error.stack;
  }

  res.status(error.statusCode).json(responsePayload);
};
