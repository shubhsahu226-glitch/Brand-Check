const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  approveKnowledge,
  disableKnowledge,
  bulkApproveKnowledge,
  deleteKnowledge,
} = require('../controllers/knowledgeController');

const router = express.Router();

router.use(requireAuth);

router.get('/', listKnowledge);
router.post('/', requireRole('ADMIN'), createKnowledge);
router.post('/bulk-approve', requireRole('ADMIN'), bulkApproveKnowledge);
router.patch('/:id', requireRole('ADMIN'), updateKnowledge);
router.post('/:id/approve', requireRole('ADMIN'), approveKnowledge);
router.post('/:id/disable', requireRole('ADMIN'), disableKnowledge);
router.delete('/:id', requireRole('ADMIN'), deleteKnowledge);

module.exports = router;
