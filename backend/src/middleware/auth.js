const prisma = require('../lib/prisma');
const { verifyAccessToken } = require('../lib/tokens');

function sendError(res, status, code, message) {
  return res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      res,
      401,
      'UNAUTHENTICATED',
      'Missing or malformed authorization token'
    );
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'UNAUTHENTICATED', 'Access token expired');
    }
    return sendError(res, 401, 'UNAUTHENTICATED', 'Invalid access token');
  }

  const userId = decoded.userId || decoded.id;
  if (!userId) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Invalid access token payload');
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { workspace: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  } catch (dbErr) {
    return next(dbErr);
  }

  if (!user) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'User no longer exists');
  }

  if (!user.memberships || user.memberships.length === 0) {
    return sendError(
      res,
      403,
      'FORBIDDEN',
      'User has no active workspace memberships'
    );
  }

  // Multi-tenant selection:
  // If X-Workspace-Id header is supplied and matches one of the user's verified memberships, use it.
  // Otherwise, default to the primary (first created) membership.
  const requestedWorkspaceId = req.headers['x-workspace-id'];
  const activeMembership = requestedWorkspaceId
    ? user.memberships.find((m) => m.workspaceId === requestedWorkspaceId) ||
      user.memberships[0]
    : user.memberships[0];

  const { passwordHash: _ph, ...safeUser } = user;
  req.user = safeUser;
  req.currentMembership = activeMembership;

  return next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (
      !req.currentMembership ||
      !allowedRoles.includes(req.currentMembership.role)
    ) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        `Action requires one of the following roles: ${allowedRoles.join(', ')}`
      );
    }
    return next();
  };
}

function scoped(req) {
  if (!req.user || !req.currentMembership) {
    throw new Error('scoped(req) called without requireAuth middleware');
  }
  return {
    userId: req.user.id,
    workspaceId: req.currentMembership.workspaceId,
    role: req.currentMembership.role,
  };
}

module.exports = {
  requireAuth,
  authenticateToken: requireAuth, // Backward-compatibility alias
  requireRole,
  scoped,
  sendError,
};
