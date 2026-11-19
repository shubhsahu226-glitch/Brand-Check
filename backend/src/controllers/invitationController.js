const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const {
  generateAccessToken,
  generateRandomToken,
  hashToken,
} = require('../lib/tokens');
const { sendInvitationEmail } = require('../lib/email');
const { AppError } = require('../lib/errors');
const { scoped, sendError } = require('../middleware/auth');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: REFRESH_EXPIRY_MS,
};

const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  role: z.enum(['CREATOR', 'REVIEWER']),
});

const acceptInviteSchema = z.object({
  token: z.string().trim().min(1, 'Invitation token is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters'),
});

async function createInvitation(req, res, next) {
  try {
    const parseResult = createInvitationSchema.safeParse(req.body);
    if (!parseResult.success) {
      const message =
        parseResult.error.errors[0]?.message || 'Validation failed';
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }

    const { email, role } = parseResult.data;
    const { workspaceId } = scoped(req);

    // Check if user is already a member of this workspace
    const existingMembership = await prisma.membership.findFirst({
      where: {
        workspaceId,
        user: { email },
      },
    });

    if (existingMembership) {
      return sendError(
        res,
        409,
        'CONFLICT',
        'User is already a member of this workspace'
      );
    }

    // Invalidate/delete any previous pending invitation for this email & workspace
    await prisma.invitation.deleteMany({
      where: {
        workspaceId,
        email,
        acceptedAt: null,
      },
    });

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role,
        tokenHash,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteUrl = `${frontendUrl}/invite/accept?token=${rawToken}`;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    await sendInvitationEmail({
      to: email,
      workspaceName: workspace?.name || 'BrandCheck Workspace',
      role,
      inviteUrl,
    });

    const responsePayload = {
      invitation,
    };

    if (process.env.NODE_ENV !== 'production') {
      responsePayload.inviteUrl = inviteUrl;
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    return next(error);
  }
}

async function getInvitations(req, res, next) {
  try {
    const { workspaceId } = scoped(req);

    const invitations = await prisma.invitation.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(invitations);
  } catch (error) {
    return next(error);
  }
}

async function inspectInvitation(req, res, next) {
  try {
    const { token } = req.params;
    if (!token) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Token is required');
    }

    let tokenHash;
    try {
      tokenHash = hashToken(token);
    } catch (_e) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid token format');
    }

    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return sendError(
        res,
        404,
        'NOT_FOUND',
        'Invitation not found or invalid'
      );
    }

    if (invitation.acceptedAt !== null) {
      return sendError(
        res,
        409,
        'CONFLICT',
        'Invitation has already been accepted'
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invitation has expired');
    }

    return res.status(200).json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      workspace: invitation.workspace,
    });
  } catch (error) {
    return next(error);
  }
}

async function acceptInvitation(req, res, next) {
  try {
    const parseResult = acceptInviteSchema.safeParse(req.body);
    if (!parseResult.success) {
      const message =
        parseResult.error.errors[0]?.message || 'Validation failed';
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }

    const { token, name, password } = parseResult.data;

    let tokenHash;
    try {
      tokenHash = hashToken(token);
    } catch (_e) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid token format');
    }

    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash },
      include: { workspace: true },
    });

    if (!invitation) {
      return sendError(
        res,
        404,
        'NOT_FOUND',
        'Invitation not found or invalid'
      );
    }

    if (invitation.acceptedAt !== null) {
      return sendError(
        res,
        409,
        'CONFLICT',
        'Invitation has already been accepted'
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invitation has expired');
    }

    const rawRefreshToken = generateRandomToken(64);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);

    const result = await prisma.$transaction(async (tx) => {
      // Concurrency guard: conditionally mark accepted
      const updateResult = await tx.invitation.updateMany({
        where: {
          id: invitation.id,
          acceptedAt: null,
        },
        data: {
          acceptedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new AppError(409, 'CONFLICT', 'Invitation has already been accepted');
      }

      let user = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user) {
        const passwordHash = await bcrypt.hash(password, 12);
        user = await tx.user.create({
          data: {
            name,
            email: invitation.email,
            passwordHash,
          },
        });
      } else {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          throw new AppError(
            401,
            'UNAUTHENTICATED',
            'Invalid password for existing account'
          );
        }
      }

      // Check if user is already a member
      const existingMembership = await tx.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: invitation.workspaceId,
          },
        },
      });

      if (existingMembership) {
        throw new AppError(
          409,
          'CONFLICT',
          'User is already a member of this workspace'
        );
      }

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
        include: { workspace: true },
      });

      await tx.refreshToken.create({
        data: {
          tokenHash: refreshTokenHash,
          userId: user.id,
          expiresAt: refreshExpiresAt,
        },
      });

      return { user, membership, workspace: invitation.workspace };
    });

    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
    });

    res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
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

module.exports = {
  createInvitation,
  getInvitations,
  inspectInvitation,
  acceptInvitation,
};
