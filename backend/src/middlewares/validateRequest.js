/**
 * Generic Zod validation middleware.
 * Accepts a Zod schema and validates req.body, req.query, or req.params.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to parse against
 * @param {'body' | 'query' | 'params'} source - Target property on the request object
 */
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // Replace with sanitized/coerced data
      next();
    } catch (err) {
      next(err); // Forward directly to global errorHandler
    }
  };
};
