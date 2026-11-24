const express = require('express');
const {
  getCurrentWorkspace,
  getWorkspaceAnalytics,
} = require('../controllers/workspaceController');
const {
  createInvitation,
  inspectInvitation,
  acceptInvitation,
} = require('../controllers/invitationController');
const {
  getMembers,
  updateMemberRole,
} = require('../controllers/memberController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Current workspace info & analytics
router.get('/current', requireAuth, getCurrentWorkspace);
router.get('/analytics', requireAuth, getWorkspaceAnalytics);

// Member management
router.get('/members', requireAuth, requireRole('ADMIN'), getMembers);
router.patch('/members/:id/role', requireAuth, requireRole('ADMIN'), updateMemberRole);

// Invitations under /workspaces
router.post('/invite', requireAuth, requireRole('ADMIN'), createInvitation);
router.get('/invitations/:token', inspectInvitation);
router.post('/invitations/accept', acceptInvitation);

module.exports = router;
