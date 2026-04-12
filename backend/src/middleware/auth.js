const { createClient } = require('@supabase/supabase-js');

/**
 * JWT verification middleware.
 * Validates Supabase auth token from Authorization header.
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'UNAUTHORIZED'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'UNAUTHORIZED'
    });
  }
}

module.exports = { verifyToken };
