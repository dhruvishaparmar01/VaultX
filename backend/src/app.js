require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const http = require('http');

const app = express();

// ─── Security Headers ───
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// ─── CORS ───
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, Postman)
    if (!origin) return callback(null, true);
    // Allow any localhost port in development
    if (origin.match(/^http:\/\/localhost:\d+$/)) return callback(null, true);
    // Allow configured frontend URL
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
    // Allow Vercel preview URLs
    if (origin.match(/\.vercel\.app$/)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Body Parser with size limit ───
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Routes ───
app.use('/api/encrypt', require('./routes/encrypt'));
app.use('/api/vault', require('./routes/vault'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/auth', require('./routes/auth'));

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'VaultX Backend is running' } });
});

// ─── Error Handler (must be LAST) ───
app.use(errorHandler);

// ─── Start Server ───
const initialPort = Number(process.env.PORT) || 5000;

function startServer(port) {
  const server = http.createServer(app);

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is in use. Retrying on port ${nextPort}...`);
      setTimeout(() => startServer(nextPort), 250);
      return;
    }

    console.error('Server failed to start:', err?.message || err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║   VaultX Backend running on port ${port}  ║`);
    console.log(`╚══════════════════════════════════════╝\n`);

    // Run encryption tests at startup
    runStartupTests();
  });
}

startServer(initialPort);

// ─── Startup Tests ───
function runStartupTests() {
  const { hmacEncrypt, checkPasswordStrength } = require('./utils/encryption');

  console.log('─── Running Startup Tests ───\n');

  // Test 1: HMAC Determinism
  try {
    const results = Array.from({ length: 10 }, () => hmacEncrypt('abcd@123'));
    const allSame = results.every(r => r === results[0]);
    console.log(`HMAC Determinism:  ${allSame ? '✅ PASS' : '❌ FAIL'}`);
  } catch (e) {
    console.log(`HMAC Determinism:  ❌ FAIL (${e.message})`);
  }

  // Test 2: Strength Checker
  const tests = [
    { input: 'abc', expected: 'Weak' },
    { input: 'password', expected: 'Too Common' },
    { input: 'Hello@123', expected: 'Strong' },
    { input: 'X9#mK!pL2@vQ', expected: 'Very Strong' }
  ];

  tests.forEach(({ input, expected }) => {
    const result = checkPasswordStrength(input);
    const pass = result.label === expected;
    console.log(`Strength "${input}": ${pass ? '✅ PASS' : `❌ FAIL (got ${result.label})`}`);
  });

  console.log('\n─── Tests Complete ───\n');
}

module.exports = app;
