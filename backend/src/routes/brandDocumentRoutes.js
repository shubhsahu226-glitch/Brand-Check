const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  upload,
  uploadBrandDocument,
  listBrandDocuments,
  getBrandDocument,
  deleteBrandDocument,
} = require('../controllers/brandDocumentController');

const router = express.Router();

router.use(requireAuth);

router.post('/', requireRole('ADMIN'), upload.single('file'), uploadBrandDocument);
router.get('/', listBrandDocuments);
router.get('/:id', getBrandDocument);
router.delete('/:id', requireRole('ADMIN'), deleteBrandDocument);

module.exports = router;
