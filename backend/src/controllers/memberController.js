const { z } = require('zod');
const prisma = require('../lib/prisma');
const { scoped, sendError } = require('../middleware/auth');

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'CREATOR', 'REVIEWER']),
});

async function getMembers(req, res, next) {
  try {
    const { workspaceId } = scoped(req);

    const members = await prisma.membership.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json(members);
  } catch (error) {
    return next(error);
  }
}

async function updateMemberRole(req, res, next) {
  try {
    const parseResult = updateRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      const message =
        parseResult.error.errors[0]?.message || 'Validation failed';
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }

    const { role: newRole } = parseResult.data;
    const { workspaceId, userId } = scoped(req);
    const { id: memberId } = req.params;

    // Verify target membership exists and belongs to this workspace
    const targetMember = await prisma.membership.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
    });

    if (!targetMember) {
      return sendError(res, 404, 'NOT_FOUND', 'Member not found');
    }

    // Guard against sole admin self-demotion
    if (
      targetMember.userId === userId &&
      targetMember.role === 'ADMIN' &&
      newRole !== 'ADMIN'
    ) {
      const adminCount = await prisma.membership.count({
        where: {
          workspaceId,
          role: 'ADMIN',
        },
      });

      if (adminCount <= 1) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Cannot demote the only administrator in this workspace'
        );
      }
    }

    const updated = await prisma.membership.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      id: updated.id,
      role: updated.role,
      user: updated.user,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMembers,
  updateMemberRole,
};
