const express = require('express');
const { validationResult } = require('express-validator');
const { aiSuggestValidation } = require('../utils/validators');
const { verifyToken } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const DEFAULT_SUGGESTIONS = [
  'Add uppercase and lowercase letters',
  'Include symbols like !@#$%',
  'Use 12 or more characters'
];

// POST /api/ai/suggest
router.post('/suggest', verifyToken, generalLimiter, aiSuggestValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg, code: 'INVALID_INPUT' });
    }

    const { password, strength } = req.body;

    // Only provide suggestions for weak/fair passwords
    if (strength.label === 'Strong' || strength.label === 'Very Strong') {
      return res.json({
        success: true,
        data: { suggestions: ['Your password is already strong!'] },
        error: null
      });
    }

    // If no Gemini API key, return strength-based suggestions
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        data: { suggestions: strength.suggestions || DEFAULT_SUGGESTIONS },
        error: null
      });
    }

    try {
      const prompt = `You are a cybersecurity expert. Analyze this password pattern and give exactly 3 short improvement tips. Each tip must be under 15 words.
Password strength level: ${strength.label}
Password length: ${password.length} characters
Has uppercase: ${/[A-Z]/.test(password)}
Has numbers: ${/[0-9]/.test(password)}
Has symbols: ${/[!@#$%^&*]/.test(password)}
Respond ONLY in this JSON format, no extra text:
{ "suggestions": ["tip1", "tip2", "tip3"] }`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
          })
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error('Gemini API error');
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
          return res.json({
            success: true,
            data: { suggestions: parsed.suggestions.slice(0, 3) },
            error: null
          });
        }
      }

      throw new Error('Failed to parse Gemini response');
    } catch (aiError) {
      // Fallback to default suggestions if Gemini fails
      console.error('Gemini AI error:', aiError.message);
      return res.json({
        success: true,
        data: { suggestions: strength.suggestions || DEFAULT_SUGGESTIONS },
        error: null
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
