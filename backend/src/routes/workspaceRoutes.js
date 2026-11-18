const express = require('express');
const {
  createWorkspace,
  getCurrentWorkspace,
  getWorkspaceMembers,
  inviteMember,
  getInvitationDetails,
  acceptInvitation,
  updateMemberRole,
} = require('../controllers/workspaceController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createWorkspace);
router.get('/current', authenticateToken, getCurrentWorkspace);
router.get('/members', authenticateToken, getWorkspaceMembers);
router.post('/invite', authenticateToken, inviteMember);
router.get('/invitations/:token', getInvitationDetails);
router.post('/invitations/accept', authenticateToken, acceptInvitation);
router.patch('/members/:id/role', authenticateToken, updateMemberRole);

module.exports = router;

