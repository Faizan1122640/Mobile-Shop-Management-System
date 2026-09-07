/**
 * catchAsync utility wrapper.
 * Catches rejected promises in async Express handlers and forwards them to next(err)
 * eliminating repetitive try/catch blocks across controllers.
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
