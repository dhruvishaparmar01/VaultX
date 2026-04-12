const express = require('express');
const { validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const { hmacEncrypt, aesEncrypt, aesDecrypt, checkPasswordStrength } = require('../utils/encryption');
const { vaultSaveValidation, vaultRevealValidation } = require('../utils/validators');
const { verifyToken } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

// Fire-and-forget activity logging — never blocks response
function logActivity(supabase, userId, action, metadata) {
  supabase.from('activity_logs')
    .insert({
      user_id: userId,
      action,
      metadata
    })
    .then(() => {})
    .catch(err => console.error('Activity log failed:', err.message));
}

// POST /api/vault/save
router.post('/save', verifyToken, generalLimiter, vaultSaveValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg, code: 'INVALID_INPUT' });
    }

    const { siteName, category, saveType, originalPassword, masterPassword, notes } = req.body;
    const userId = req.user.id;

    // Generate HMAC encrypted version
    const encryptedVersion = hmacEncrypt(originalPassword);

    // Calculate strength score for storage
    const strength = checkPasswordStrength(originalPassword);

    let originalEncrypted = null;
    let iv = null;
    let authTag = null;

    // If saving original password, AES encrypt it
    if ((saveType === 'original' || saveType === 'both') && masterPassword) {
      const aesResult = aesEncrypt(originalPassword, masterPassword, userId);
      originalEncrypted = aesResult.encrypted;
      iv = aesResult.iv;
      authTag = aesResult.authTag;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('passwords')
      .insert({
        user_id: userId,
        site_name: siteName,
        category,
        original_password: originalEncrypted,
        encrypted_version: encryptedVersion,
        save_type: saveType,
        iv,
        auth_tag: authTag,
        strength_score: strength.score,
        notes: notes || null
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Database insert error:', error.message);
      return res.status(500).json({ success: false, error: 'Failed to save password', code: 'DATABASE_ERROR' });
    }

    // Fire and forget activity log
    logActivity(supabase, userId, 'added', { site_name: siteName, category });

    res.json({
      success: true,
      data: { id: data.id, createdAt: data.created_at },
      error: null
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/vault/list
router.get('/list', verifyToken, generalLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category, search } = req.query;

    const supabase = getSupabase();
    let query = supabase
      .from('passwords')
      .select('id, site_name, category, save_type, encrypted_version, strength_score, is_breached, notes, created_at, last_updated')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('site_name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch passwords', code: 'DATABASE_ERROR' });
    }

    res.json({
      success: true,
      data: { passwords: data || [] },
      error: null
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/vault/reveal
router.post('/reveal', verifyToken, generalLimiter, vaultRevealValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg, code: 'INVALID_INPUT' });
    }

    const { id, masterPassword } = req.body;
    const userId = req.user.id;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('passwords')
      .select('original_password, iv, auth_tag, site_name')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Password not found', code: 'NOT_FOUND' });
    }

    if (!data.original_password || !data.iv || !data.auth_tag) {
      return res.status(400).json({ success: false, error: 'Original password was not saved for this entry', code: 'INVALID_INPUT' });
    }

    try {
      const decrypted = aesDecrypt(data.original_password, data.iv, data.auth_tag, masterPassword, userId);

      // Fire and forget activity log
      logActivity(supabase, userId, 'viewed', { site_name: data.site_name });

      res.json({
        success: true,
        data: { password: decrypted },
        error: null
      });
    } catch (decryptError) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect master password',
        code: 'UNAUTHORIZED'
      });
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vault/delete — accepts id from query or body
router.delete('/delete', verifyToken, generalLimiter, async (req, res, next) => {
  try {
    const id = req.query.id || req.body?.id;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Password ID is required', code: 'INVALID_INPUT' });
    }

    const supabase = getSupabase();

    // First verify the entry belongs to this user
    const { data: existing } = await supabase
      .from('passwords')
      .select('id, site_name')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Password not found', code: 'NOT_FOUND' });
    }

    const { error } = await supabase
      .from('passwords')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to delete', code: 'DATABASE_ERROR' });
    }

    // Fire and forget activity log
    logActivity(supabase, userId, 'deleted', { site_name: existing.site_name });

    res.json({ success: true, data: null, error: null });
  } catch (error) {
    next(error);
  }
});

// GET /api/vault/export
router.get('/export', verifyToken, generalLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('passwords')
      .select('site_name, category, encrypted_version, save_type, created_at')
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to export', code: 'DATABASE_ERROR' });
    }

    const exportData = JSON.stringify({ passwords: data, exportedAt: new Date().toISOString() }, null, 2);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=vaultx-export.json');
    res.send(exportData);

    // Fire and forget activity log
    logActivity(supabase, userId, 'exported', { count: data.length });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vault/clear-all
router.delete('/clear-all', verifyToken, generalLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('passwords')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to clear vault', code: 'DATABASE_ERROR' });
    }

    // Fire and forget activity log
    logActivity(supabase, userId, 'deleted', { action: 'cleared_all' });

    res.json({ success: true, data: null, error: null });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
