const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const helmet       = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit    = require('express-rate-limit');

const authRoutes         = require('./routes/auth.routes');
const ticketRoutes       = require('./routes/ticket.routes');
const userRoutes         = require('./routes/user.routes');
const notificationRoutes = require('./routes/notification.routes');
const knowledgeRoutes    = require('./routes/knowledge.routes');
const analyticsRoutes    = require('./routes/analytics.routes');
const auditRoutes        = require('./routes/audit.routes');
const reportRoutes       = require('./routes/report.routes');
const errorHandler       = require('./middleware/error.middleware');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── NoSQL injection prevention ────────────────────────────────────────────────
app.use(mongoSanitize());

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts — try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) =>
  res.json({ status: 'operational', version: '3.0.0', timestamp: new Date() })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/tickets',       ticketRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/knowledge',     knowledgeRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/audit',         auditRoutes);
app.use('/api/reports',       reportRoutes);   // Phase 6

// ── 404 + Error handler ───────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
