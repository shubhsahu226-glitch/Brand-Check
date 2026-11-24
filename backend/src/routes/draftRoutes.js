const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listDrafts,
  createDraft,
  getDraft,
  updateDraft,
  checkDraftCompliance,
  applySuggestionAction,
  submitDraft,
  reviewDraft,
  deleteDraft,
} = require('../controllers/draftController');

const router = express.Router();

router.use(requireAuth);

router.get('/', listDrafts);
router.post('/', createDraft);
router.get('/:id', getDraft);
router.put('/:id', updateDraft);
router.post('/:id/check', checkDraftCompliance);
router.post('/:id/suggestions/:suggestionId/action', applySuggestionAction);
router.post('/:id/submit', submitDraft);
router.post('/:id/review', reviewDraft);
router.delete('/:id', deleteDraft);

module.exports = router;
