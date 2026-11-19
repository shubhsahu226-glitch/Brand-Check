const express = require('express');
const {
  getMembers,
  updateMemberRole,
} = require('../controllers/memberController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('ADMIN'), getMembers);
router.patch('/:id/role', requireAuth, requireRole('ADMIN'), updateMemberRole);

module.exports = router;
