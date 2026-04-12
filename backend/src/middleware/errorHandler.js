/**
 * Global error handler — never exposes internal details.
 */
function errorHandler(err, req, res, _next) {
  console.error('Server Error:', err.message);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'Origin not allowed',
      code: 'FORBIDDEN'
    });
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal server error' : err.message,
    code
  });
}

module.exports = { errorHandler };
