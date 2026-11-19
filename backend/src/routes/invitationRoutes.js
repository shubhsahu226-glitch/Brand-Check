const express = require('express');
const {
  createInvitation,
  getInvitations,
  inspectInvitation,
  acceptInvitation,
} = require('../controllers/invitationController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/accept', acceptInvitation);
router.get('/inspect/:token', inspectInvitation);
router.get('/:token', inspectInvitation); // Alias for frontend compatibility

// Admin-only routes
router.post('/', requireAuth, requireRole('ADMIN'), createInvitation);
router.get('/', requireAuth, requireRole('ADMIN'), getInvitations);

module.exports = router;
