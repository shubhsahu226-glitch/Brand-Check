const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const {
  generateAccessToken,
  generateRandomToken,
  hashToken,
} = require('../lib/tokens');
const { sendError } = require('../middleware/auth');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const cookieSameSite = process.env.COOKIE_SAME_SITE || 'lax';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: cookieSameSite,
  path: '/api/auth',
  maxAge: REFRESH_EXPIRY_MS,
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: cookieSameSite,
  path: '/api/auth',
};

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters'),
  workspaceName: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(100)
    .trim(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

async function signup(req, res, next) {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      const message = parseResult.error.errors[0]?.message || 'Validation failed';
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }

    const { name, email, password, workspaceName } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(
        res,
        409,
        'CONFLICT',
        'User with this email already exists'
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rawRefreshToken = generateRandomToken(64);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          createdById: user.id,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'ADMIN',
        },
      });

      await tx.refreshToken.create({
        data: {
          tokenHash: refreshTokenHash,
          userId: user.id,
          expiresAt: refreshExpiresAt,
        },
      });

      return { user, workspace, membership };
    });

    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
    });

    res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        role: result.membership.role,
      },
      accessToken,
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const message = parseResult.error.errors[0]?.message || 'Validation failed';
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      return sendError(res, 401, 'UNAUTHENTICATED', 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 401, 'UNAUTHENTICATED', 'Invalid email or password');
    }

    if (!user.memberships || user.memberships.length === 0) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'User has no active workspace memberships'
      );
    }

    const activeMembership = user.memberships[0];

    const rawRefreshToken = generateRandomToken(64);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);

    await prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      workspace: {
        id: activeMembership.workspace.id,
        name: activeMembership.workspace.name,
        role: activeMembership.role,
      },
      accessToken,
    });
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      return sendError(res, 401, 'UNAUTHENTICATED', 'Missing refresh token');
    }

    const tokenHash = hashToken(rawRefreshToken);

    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // Reuse detection: if token exists but was already revoked, revoke all tokens for this user
    if (existingToken && existingToken.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: existingToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      res.clearCookie(REFRESH_COOKIE_NAME, CLEAR_COOKIE_OPTIONS);
    res.clearCookie(REFRESH_COOKIE_NAME, { ...CLEAR_COOKIE_OPTIONS, path: '/' });
    res.clearCookie(REFRESH_COOKIE_NAME, { ...CLEAR_COOKIE_OPTIONS, path: '/auth' });
      return sendError(
        res,
        401,
        'UNAUTHENTICATED',
        'Revoked refresh token reuse detected'
      );
    }

    if (!existingToken) {
      res.clearCookie(REFRESH_COOKIE_NAME, CLEAR_COOKIE_OPTIONS);
    res.clearCookie(REFRESH_COOKIE_NAME, { ...CLEAR_COOKIE_OPTIONS, path: '/' });
    res.clearCookie(REFRESH_COOKIE_NAME, { ...CLEAR_COOKIE_OPTIONS, path: '/auth' });
      return sendError(
        res,
        401,
        'UNAUTHENTICATED',
        'Invalid or unrecognized refresh token'
      );
    }

    if (new Date(existingToken.expiresAt) < new Date()) {
      res.clearCookie(REFRESH_COOKIE_NAME, CLEAR_COOKIE_OPTIONS);
    res.clearCookie(REFRESH_COOKIE_NAME, { ...CLEAR_COOKIE_OPTIONS, path: '/' });
    res.clearCookie(REFRESH_COOKIE_NAME, { ...CLEAR_COOKIE_OPTIONS, path: '/auth' });
      return sendError(res, 401, 'UNAUTHENTICATED', 'Refresh token expired');
    }

    // Token is valid: rotate token
    const newRawRefreshToken = generateRandomToken(64);
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: existingToken.userId,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    const newAccessToken = generateAccessToken({
      userId: existingToken.user.id,
      email: existingToken.user.email,
    });

    res.cookie(REFRESH_COOKIE_NAME, newRawRefreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawRefreshToken && typeof rawRefreshToken === 'string') {
      try {
        const tokenHash = hashToken(rawRefreshToken);
        await prisma.refreshToken.updateMany({
          where: { tokenHash, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } catch (_e) {
        // Ignore token hashing/lookup error on logout
      }
    }

    res.clearCookie(REFRESH_COOKIE_NAME, CLEAR_COOKIE_OPTIONS);
    res.clearCookie(REFRESH_COOKIE_NAME, { ...CLEAR_COOKIE_OPTIONS, path: '/' });
    res.clearCookie(REFRESH_COOKIE_NAME, { ...CLEAR_COOKIE_OPTIONS, path: '/auth' });

    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res) {
  if (!req.user || !req.currentMembership) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required');
  }

  return res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    },
    workspace: {
      id: req.currentMembership.workspace.id,
      name: req.currentMembership.workspace.name,
      role: req.currentMembership.role,
    },
    role: req.currentMembership.role,
  });
}

const DEMO_CONFIG = {
  ADMIN: {
    email: 'admin.demo@brandcheck.io',
    name: 'Demo Admin',
  },
  CREATOR: {
    email: 'creator.demo@brandcheck.io',
    name: 'Demo Creator',
  },
  REVIEWER: {
    email: 'reviewer.demo@brandcheck.io',
    name: 'Demo Reviewer',
  },
};

const DEMO_WORKSPACE_NAME = 'Acme Brand (Demo Workspace)';

async function demoLogin(req, res, _next) {
  try {
    const { role } = req.body || {};
    if (!role || !DEMO_CONFIG[role]) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Invalid role for demo login. Allowed roles: ADMIN, CREATOR, REVIEWER'
      );
    }

    const { email, name } = DEMO_CONFIG[role];

    // Find or create the shared demo workspace
    let workspace = await prisma.workspace.findFirst({
      where: { name: DEMO_WORKSPACE_NAME },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: DEMO_WORKSPACE_NAME,
          createdById: 'demo-system',
        },
      });
    }

    // Find or create the demo user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const dummyPassword = await bcrypt.hash('DemoPassword123!', 10);
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: dummyPassword,
        },
      });
    }

    // Upsert membership for this user in the demo workspace
    const membership = await prisma.membership.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspace.id,
        },
      },
      update: {
        role,
      },
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        role,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: membership.role,
      workspaceId: workspace.id,
    });

    const rawRefreshToken = generateRandomToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Demo logins use a session cookie (no maxAge) so closing the browser tab or visiting root
    // does not permanently lock the user into Demo Admin for 7 days.
    const DEMO_COOKIE_OPTIONS = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: cookieSameSite,
      path: '/api/auth',
    };
    res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, DEMO_COOKIE_OPTIONS);

    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        role: membership.role,
      },
      role: membership.role,
    });
  } catch (error) {
    console.warn(
      `[Demo Login] Database offline (${error.message}). Providing resilient offline demo session.`
    );
    const role = (req.body?.role || 'ADMIN').toUpperCase();
    const config = DEMO_CONFIG[role] || DEMO_CONFIG.ADMIN;
    const demoUser = {
      id: `demo_${role.toLowerCase()}_user`,
      email: config.email,
      name: config.name,
    };
    const demoWorkspace = {
      id: 'demo_workspace_acme',
      name: DEMO_WORKSPACE_NAME,
      role,
    };
    const accessToken = generateAccessToken({
      userId: demoUser.id,
      email: demoUser.email,
      role,
      workspaceId: demoWorkspace.id,
    });
    return res.status(200).json({
      accessToken,
      user: demoUser,
      workspace: demoWorkspace,
      role,
    });
  }
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  me,
  demoLogin,
};
