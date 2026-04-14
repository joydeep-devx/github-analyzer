require('dotenv').config();
console.log('Token loaded:', process.env.GITHUB_TOKEN ? '✅ YES' : '❌ NO');

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const githubRouter = require('./routes/github');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com'],
      styleSrc:   ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdn.jsdelivr.net'],
      fontSrc:    ["'self'", 'fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:', 'avatars.githubusercontent.com', '*.githubusercontent.com'],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please wait 15 minutes before retrying.' },
});
app.use('/api/', limiter);

// ─── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Static Files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/github', githubRouter);

// ─── SPA Fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 GitHub Profile Analyzer running at http://localhost:${PORT}\n`);
  if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN === 'your_personal_access_token_here') {
    console.warn('⚠️  WARNING: GITHUB_TOKEN is not set in .env — API calls will be rate-limited (60 req/hr).\n');
  }
});
