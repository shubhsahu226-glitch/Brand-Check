const jwt = require('jsonwebtoken');
const { verifyAccessToken } = require('../lib/tokens');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Missing token',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: 'error',
        message: 'Expired token',
      });
    }
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
  }
}

module.exports = {
  authenticateToken,
};

