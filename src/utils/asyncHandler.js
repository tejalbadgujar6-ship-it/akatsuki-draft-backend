/**
 * Higher-order wrapper to catch async route errors and forward them to next()
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
