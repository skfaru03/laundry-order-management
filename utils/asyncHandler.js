/**
 * Wraps an async controller function and forwards any uncaught errors
 * to Express's next() so the global error handler catches them cleanly.
 *
 * Usage:
 *   router.post('/', asyncHandler(myController))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
