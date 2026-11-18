const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { sendInvitationEmail } = require('../lib/email');

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, 'Workspace name is required'),
});

const inviteSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  role: z.enum(['ADMIN', 'CREATOR', 'REVIEWER']).default('CREATOR'),
  workspaceId: z.string().optional(),
});

const acceptInviteSchema = z.object({
  token: z.string().trim().min(1, 'Invitation token is required'),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'CREATOR', 'REVIEWER']),
});

async function resolveWorkspace(req, explicitWorkspaceId = null) {
  const workspaceId =
    explicitWorkspaceId ||
    req.body?.workspaceId ||
    req.headers['x-workspace-id'] ||
    req.query?.workspaceId;

  if (workspaceId) {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId,
        },
      },
      include: { workspace: true },
    });
    return member;
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: req.user.id },
    include: { workspace: true },
    orderBy: { createdAt: 'asc' },
  });
  return member;
}

async function createWorkspace(req, res) {
  try {
    const parseResult = createWorkspaceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        status: 'error',
        message: parseResult.error.errors[0]?.message || 'Validation failed',
      });
    }

    const { name } = parseResult.data;

    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name },
      });

      const member = await tx.workspaceMember.create({
        data: {
          userId: req.user.id,
          workspaceId: workspace.id,
          role: 'ADMIN',
        },
      });

      return { workspace, member };
    });

    return res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error creating workspace',
    });
  }
}

async function getCurrentWorkspace(req, res) {
  try {
    const member = await resolveWorkspace(req);
    if (!member) {
      return res.status(404).json({
        status: 'error',
        message: 'No workspace found for this user',
      });
    }

    const membersCount = await prisma.workspaceMember.count({
      where: { workspaceId: member.workspaceId },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        workspace: member.workspace,
        role: member.role,
        membersCount,
      },
    });
  } catch (error) {
    console.error('Get current workspace error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error fetching workspace',
    });
  }
}

async function getWorkspaceMembers(req, res) {
  try {
    const member = await resolveWorkspace(req);
    if (!member) {
      return res.status(404).json({
        status: 'error',
        message: 'Workspace not found or access denied',
      });
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: member.workspaceId },
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

    let pendingInvitations = [];
    if (member.role === 'ADMIN') {
      pendingInvitations = await prisma.invitation.findMany({
        where: {
          workspaceId: member.workspaceId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        workspaceId: member.workspaceId,
        members,
        pendingInvitations,
      },
    });
  } catch (error) {
    console.error('Get workspace members error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error fetching members',
    });
  }
}

async function inviteMember(req, res) {
  try {
    const parseResult = inviteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        status: 'error',
        message: parseResult.error.errors[0]?.message || 'Validation failed',
      });
    }

    const { email, role, workspaceId: explicitWorkspaceId } = parseResult.data;

    const currentMember = await resolveWorkspace(req, explicitWorkspaceId);
    if (!currentMember) {
      return res.status(404).json({
        status: 'error',
        message: 'Workspace not found',
      });
    }

    if (currentMember.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only workspace admins can invite members',
      });
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaceMembers: {
          where: { workspaceId: currentMember.workspaceId },
        },
      },
    });

    if (existingUser && existingUser.workspaceMembers.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User is already a member of this workspace',
      });
    }

    // Check if active pending invitation already exists
    const activeInvitation = await prisma.invitation.findFirst({
      where: {
        workspaceId: currentMember.workspaceId,
        email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (activeInvitation) {
      return res.status(409).json({
        status: 'error',
        message: 'A pending invitation already exists for this email in this workspace',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        workspaceId: currentMember.workspaceId,
        email,
        role,
        token,
        status: 'PENDING',
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteUrl = `${frontendUrl}/invite/accept?token=${token}`;

    await sendInvitationEmail({
      to: email,
      workspaceName: currentMember.workspace.name,
      role,
      inviteUrl,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Invitation created and sent successfully',
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          expiresAt: invitation.expiresAt,
        },
        inviteUrl,
      },
    });
  } catch (error) {
    console.error('Invite member error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error creating invitation',
    });
  }
}

async function getInvitationDetails(req, res) {
  try {
    const { token } = req.params;
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invitation) {
      return res.status(404).json({
        status: 'error',
        message: 'Invitation not found',
      });
    }

    const isExpired = invitation.expiresAt < new Date();
    return res.status(200).json({
      status: 'success',
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: isExpired ? 'EXPIRED' : invitation.status,
        expiresAt: invitation.expiresAt,
        workspace: invitation.workspace,
      },
    });
  } catch (error) {
    console.error('Get invitation details error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error fetching invitation',
    });
  }
}

async function acceptInvitation(req, res) {
  try {
    const parseResult = acceptInviteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        status: 'error',
        message: parseResult.error.errors[0]?.message || 'Validation failed',
      });
    }

    const { token } = parseResult.data;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invitation) {
      return res.status(404).json({
        status: 'error',
        message: 'Invitation not found',
      });
    }

    if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Invitation has expired or already been accepted',
      });
    }

    // Verify that the logged-in user email matches the invited email
    if (req.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        status: 'error',
        message: `This invitation was sent to ${invitation.email}. You are signed in as ${req.user.email}.`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId: invitation.workspaceId,
          },
        },
        create: {
          userId: req.user.id,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
        update: {
          role: invitation.role,
        },
      });

      await tx.user.update({
        where: { id: req.user.id },
        data: { role: invitation.role },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return member;
    });

    return res.status(200).json({
      status: 'success',
      message: 'Invitation accepted successfully',
      data: {
        workspace: invitation.workspace,
        role: invitation.role,
        member: result,
      },
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error accepting invitation',
    });
  }
}

async function updateMemberRole(req, res) {
  try {
    const { id } = req.params;
    const parseResult = updateRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        status: 'error',
        message: parseResult.error.errors[0]?.message || 'Validation failed',
      });
    }

    const { role } = parseResult.data;

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id },
    });

    if (!targetMember) {
      return res.status(404).json({
        status: 'error',
        message: 'Workspace member not found',
      });
    }

    // Verify requester is an ADMIN of this workspace
    const requesterMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: targetMember.workspaceId,
        },
      },
    });

    if (!requesterMember || requesterMember.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only workspace admins can change member roles',
      });
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { id },
      data: { role },
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
      status: 'success',
      data: {
        member: updatedMember,
      },
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error updating member role',
    });
  }
}

module.exports = {
  createWorkspace,
  getCurrentWorkspace,
  getWorkspaceMembers,
  inviteMember,
  getInvitationDetails,
  acceptInvitation,
  updateMemberRole,
};

