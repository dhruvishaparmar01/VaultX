const express = require('express');
const { validationResult } = require('express-validator');
const { hmacEncrypt, checkPasswordStrength, hibpCheck } = require('../utils/encryption');
const { encryptValidation } = require('../utils/validators');
const { encryptLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/encrypt — No auth required
router.post('/', encryptLimiter, encryptValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        code: 'INVALID_INPUT'
      });
    }

    const { password } = req.body;

    // Run all three operations
    const encrypted = hmacEncrypt(password);
    const strength = checkPasswordStrength(password);
    const breached = await hibpCheck(password);

    res.json({
      success: true,
      data: {
        encrypted,
        strength,
        breached
      },
      error: null
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
