const crypto = require('crypto');

// ─── Startup Environment Validation ───
const REQUIRED_ENV_VARS = [
  'HMAC_SECRET_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missingVars = REQUIRED_ENV_VARS.filter(
  key => !process.env[key]
);

if (missingVars.length > 0) {
  console.error(
    'STARTUP ERROR — Missing required environment variables:',
    missingVars.join(', ')
  );
  process.exit(1);
}

console.log('✅ All required environment variables found.');

// ─── Common Passwords List ───
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'password123', 'admin', 'letmein',
  'qwerty', 'abc123', 'iloveyou', 'welcome', 'monkey', 'dragon',
  'master', 'sunshine', 'princess', 'football', '12345678', '1234567',
  'login', 'starwars', 'hello', 'trustno1', 'password1', '123123'
];

/**
 * Safe salt derivation — handles both UUID and non-UUID user IDs (Google OAuth).
 */
function deriveSalt(userId) {
  const hex = userId.replace(/-/g, '');
  if (/^[0-9a-fA-F]{32}$/.test(hex)) {
    return Buffer.from(hex, 'hex');
  }
  // Fallback for Google OAuth or non-UUID IDs
  return crypto
    .createHash('sha256')
    .update(userId)
    .digest()
    .slice(0, 16);
}

/**
 * Deterministic HMAC-SHA256 encryption.
 * Same input ALWAYS produces the same output.
 */
function hmacEncrypt(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Invalid input: password must be a non-empty string');
  }
  const hmac = crypto.createHmac('sha256', process.env.HMAC_SECRET_KEY);
  hmac.update(password, 'utf8');
  const fullHash = hmac.digest('base64url');

  // Take first 16 characters only
  return fullHash.substring(0, 16);
}

/**
 * AES-256-GCM encryption for vault storage (reversible).
 * Key derived from user's master password via PBKDF2.
 */
function aesEncrypt(plaintext, masterPassword, userId) {
  const salt = deriveSalt(userId);
  const key = crypto.pbkdf2Sync(masterPassword, salt, 310000, 32, 'sha256');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag
  };
}

/**
 * AES-256-GCM decryption for vault password reveal.
 */
function aesDecrypt(encrypted, iv, authTag, masterPassword, userId) {
  const salt = deriveSalt(userId);
  const key = crypto.pbkdf2Sync(masterPassword, salt, 310000, 32, 'sha256');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Password strength analyzer.
 * Returns score (0-100), label, color, suggestions, and isCommon flag.
 */
function checkPasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { score: 0, label: 'Weak', color: 'red', suggestions: ['Enter a password'], isCommon: false };
  }

  let score = 0;
  const suggestions = [];
  const isCommon = COMMON_PASSWORDS.includes(password.toLowerCase());

  // Length checks
  if (password.length >= 8) score += 20;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score += 20;
  else if (password.length >= 8) suggestions.push('Use 12+ characters for better security');

  // Character type checks
  if (/[A-Z]/.test(password)) score += 15;
  else suggestions.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score += 15;
  else suggestions.push('Add lowercase letters');

  if (/[0-9]/.test(password)) score += 15;
  else suggestions.push('Add a number');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) score += 15;
  else suggestions.push('Add a symbol like !@#$%');

  // Common password penalty
  if (isCommon) score = Math.max(0, score - 50);

  // Clamp score
  score = Math.min(100, Math.max(0, score));

  // Determine label and color
  let label, color;
  if (isCommon && score <= 25) {
    label = 'Too Common';
    color = 'red';
  } else if (score <= 25) {
    label = 'Weak';
    color = 'red';
  } else if (score <= 50) {
    label = 'Fair';
    color = 'yellow';
  } else if (score <= 85) {
    label = 'Strong';
    color = '#54ACBF';
  } else {
    label = 'Very Strong';
    color = '#A7EBF2';
  }

  return { score, label, color, suggestions: suggestions.slice(0, 3), isCommon };
}

/**
 * HaveIBeenPwned breach check using k-anonymity.
 * Only the first 5 chars of the SHA-1 hash are sent externally.
 */
async function hibpCheck(password) {
  try {
    const sha1 = crypto.createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();

    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: { 'Add-Padding': 'true' },
        signal: AbortSignal.timeout(8000)
      }
    );

    if (!response.ok) {
      return { breached: null, count: 0 };
    }

    const text = await response.text();
    const lines = text.split('\n');

    const match = lines.find(line => line.split(':')[0].trim() === suffix);

    if (match) {
      const count = parseInt(match.split(':')[1].trim());
      return { breached: true, count };
    }
    return { breached: false, count: 0 };
  } catch (error) {
    // If HIBP is down, don't fail the request
    console.error('HIBP check failed:', error.message);
    return { breached: null, count: 0 };
  }
}

module.exports = {
  hmacEncrypt,
  aesEncrypt,
  aesDecrypt,
  checkPasswordStrength,
  hibpCheck
};
