const express = require('express');
const {
  createInvitation,
  inspectInvitation,
  acceptInvitation,
} = require('../controllers/invitationController');
const {
  getMembers,
  updateMemberRole,
} = require('../controllers/memberController');
const { requireAuth, requireRole, scoped } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// Current workspace info
router.get('/current', requireAuth, async (req, res, next) => {
  try {
    const { workspaceId, role } = scoped(req);
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    const membersCount = await prisma.membership.count({
      where: { workspaceId },
    });
    return res.status(200).json({
      workspace,
      role,
      membersCount,
    });
  } catch (error) {
    return next(error);
  }
});

// Member management
router.get('/members', requireAuth, requireRole('ADMIN'), getMembers);
router.patch('/members/:id/role', requireAuth, requireRole('ADMIN'), updateMemberRole);

// Invitations under /workspaces
router.post('/invite', requireAuth, requireRole('ADMIN'), createInvitation);
router.get('/invitations/:token', inspectInvitation);
router.post('/invitations/accept', acceptInvitation);

module.exports = router;
