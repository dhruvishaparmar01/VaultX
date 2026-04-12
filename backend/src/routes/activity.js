const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// GET /api/activity/recent
router.get('/recent', verifyToken, generalLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, action, metadata, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Activity fetch error:', error.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch activity', code: 'DATABASE_ERROR' });
    }

    res.json({
      success: true,
      data: { activities: data || [] },
      error: null
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
