const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const pino = require('pino');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');

const prisma = require('./lib/prisma');
const { notFoundHandler, errorHandler } = require('./lib/errors');
const { requireAuth } = require('./middleware/auth');
const { me } = require('./controllers/authController');
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const memberRoutes = require('./routes/memberRoutes');

const app = express();

// Trust proxy in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers with Helmet
app.use(helmet());

// CORS configuration - exact origin, credentials true
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// JSON body parser with limit
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Structured logging with pino-http
const isTest = process.env.NODE_ENV === 'test';
const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || 'info',
});

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
    redact: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
    ],
  })
);

// Set X-Request-Id header on response
app.use((req, res, next) => {
  if (req.id) {
    res.setHeader('X-Request-Id', req.id);
  }
  next();
});

// Global Rate Limiter
const globalWindowMs =
  Number(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS) || 60 * 1000;
const globalMax = Number(process.env.RATE_LIMIT_GLOBAL_MAX) || 100;

const globalLimiter = rateLimit({
  windowMs: globalWindowMs,
  max: globalMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
      },
    });
  },
});
app.use(globalLimiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'ok',
      service: 'brandcheck-backend',
      database: 'connected',
    });
  } catch (_error) {
    return res.status(200).json({
      status: 'degraded',
      service: 'brandcheck-backend',
      database: 'disconnected',
    });
  }
});

// Route mounts
app.get('/api/me', requireAuth, me);
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Central 404 handler
app.use(notFoundHandler);

// Central error-handling middleware
app.use(errorHandler);

module.exports = app;
