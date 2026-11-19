const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.trim().length < 32) {
      throw new Error(
        'JWT_ACCESS_SECRET must be set and at least 32 characters long in production'
      );
    }
    return secret;
  }
  return secret && secret.trim().length >= 32
    ? secret
    : 'dev-access-secret-brandcheck-key-32chars';
}

function hashToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('rawToken must be a non-empty string');
  }
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateRandomToken(bytes = 64) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateAccessToken(payload) {
  if (!payload || (!payload.userId && !payload.id) || !payload.email) {
    throw new Error('payload must contain userId and email');
  }
  const secret = getJwtSecret();
  return jwt.sign(
    {
      userId: payload.userId || payload.id,
      email: payload.email,
    },
    secret,
    { expiresIn: '15m' }
  );
}

function verifyAccessToken(token) {
  if (!token) {
    throw new Error('token is required');
  }
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

module.exports = {
  getJwtSecret,
  hashToken,
  generateRandomToken,
  generateAccessToken,
  verifyAccessToken,
};
