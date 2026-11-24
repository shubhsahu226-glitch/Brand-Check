const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  signup,
  login,
  refresh,
  logout,
  me,
  demoLogin,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000,
  max:
    Number(process.env.RATE_LIMIT_AUTH_MAX) ||
    (process.env.NODE_ENV === 'test' ? 1000 : 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many login attempts, please try again later',
      },
    });
  },
});

router.post('/signup', signup);
router.post('/login', authLimiter, login);
router.post('/demo-login', demoLogin);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

module.exports = router;
