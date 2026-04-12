const rateLimit = require('express-rate-limit');

// Auth routes: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many attempts. Try again in 15 minutes.',
    code: 'RATE_LIMITED'
  }
});

// Encrypt endpoint: 30 requests per minute
const encryptLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Slow down.',
    code: 'RATE_LIMITED'
  }
});

// General routes: 60 requests per minute
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please wait.',
    code: 'RATE_LIMITED'
  }
});

module.exports = { authLimiter, encryptLimiter, generalLimiter };
