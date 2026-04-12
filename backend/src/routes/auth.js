const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { profileSetupValidation, changeMasterPasswordValidation } = require('../utils/validators');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

// POST /api/auth/setup-profile — called after Supabase signup
router.post('/setup-profile', verifyToken, authLimiter, profileSetupValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg, code: 'INVALID_INPUT' });
    }

    const { masterPassword } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    // Hash master password with bcrypt
    const masterPasswordHash = await bcrypt.hash(masterPassword, 12);

    const supabase = getSupabase();
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        master_password_hash: masterPasswordHash
      });

    if (error) {
      console.error('Profile setup error:', error.message);
      return res.status(500).json({ success: false, error: 'Failed to set up profile', code: 'DATABASE_ERROR' });
    }

    res.json({ success: true, data: { message: 'Profile created successfully' }, error: null });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/change-master-password
router.post('/change-master-password', verifyToken, authLimiter, changeMasterPasswordValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg, code: 'INVALID_INPUT' });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const supabase = getSupabase();

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('master_password_hash')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, profile.master_password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect', code: 'UNAUTHORIZED' });
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ master_password_hash: newHash })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ success: false, error: 'Failed to update password', code: 'DATABASE_ERROR' });
    }

    res.json({ success: true, data: { message: 'Master password updated successfully' }, error: null });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-master — verify master password before sensitive operations
router.post('/verify-master', verifyToken, authLimiter, async (req, res, next) => {
  try {
    const { masterPassword } = req.body;
    const userId = req.user.id;

    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('profiles')
      .select('master_password_hash')
      .eq('id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    const isValid = await bcrypt.compare(masterPassword, profile.master_password_hash);

    res.json({
      success: true,
      data: { verified: isValid },
      error: null
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
