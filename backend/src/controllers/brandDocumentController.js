const multer = require('multer');
const prisma = require('../lib/prisma');
const { uploadDocument, getSignedUrl, deleteDocument } = require('../lib/storage');
const { extractText, extractKnowledge } = require('../lib/aiClient');

// Multer memory storage configuration (10 MB cap)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.pptx', '.txt', '.md'];
    const lowerName = file.originalname.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => lowerName.endsWith(ext));
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE: Only PDF, DOCX, PPTX, and TXT files are supported'));
    }
  },
});

/**
 * POST /api/brand-documents
 * Admin uploads a brand document, parses text, and creates draft knowledge items.
 */
async function uploadBrandDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file uploaded. Please provide a document file.',
        },
      });
    }

    const workspaceId = req.currentMembership.workspaceId;
    const userId = req.user.id;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype || 'application/octet-stream';
    const sizeBytes = req.file.size;

    // 1. Create initial document record with status UPLOADED
    const document = await prisma.brandDocument.create({
      data: {
        workspaceId,
        uploadedById: userId,
        fileName,
        mimeType,
        sizeBytes,
        storagePath: `pending/${Date.now()}_${fileName}`,
        status: 'UPLOADED',
      },
    });

    // 2. Upload file to Supabase Storage
    const storagePath = `${workspaceId}/${document.id}/${fileName}`;
    await uploadDocument(storagePath, req.file.buffer, mimeType);

    await prisma.brandDocument.update({
      where: { id: document.id },
      data: { storagePath },
    });

    // 3. Process extraction
    let extractionResult;
    try {
      await prisma.brandDocument.update({
        where: { id: document.id },
        data: { status: 'EXTRACTING' },
      });

      extractionResult = await extractText(req.file.buffer, fileName, mimeType);
    } catch (extractErr) {
      await prisma.brandDocument.update({
        where: { id: document.id },
        data: {
          status: 'FAILED',
          errorCode: 'EXTRACTION_FAILED',
          errorMessage: extractErr.message,
        },
      });
      return res.status(200).json({
        status: 'success',
        data: {
          document: await prisma.brandDocument.findUnique({ where: { id: document.id } }),
          itemsCount: 0,
        },
      });
    }

    const { extractedText, pageCount, pages } = extractionResult;

    // 4. Extract structured knowledge items
    const knowledgeItems = await extractKnowledge(extractedText, pages, fileName);

    // 5. Store extracted items as DRAFT (Zero silent auto-approval)
    if (knowledgeItems.length > 0) {
      await prisma.knowledgeItem.createMany({
        data: knowledgeItems.map((item) => ({
          workspaceId,
          documentId: document.id,
          type: item.type || 'RULE',
          title: item.title,
          body: item.body,
          status: 'DRAFT',
          source: 'EXTRACTED',
          sourceQuote: item.sourceQuote || null,
          sourcePage: item.sourcePage || 1,
          confidence: item.confidence || 0.9,
          createdById: userId,
        })),
      });
    }

    // 6. Mark document as EXTRACTED
    const updatedDoc = await prisma.brandDocument.update({
      where: { id: document.id },
      data: {
        status: 'EXTRACTED',
        extractedText,
        pageCount: pageCount || 1,
      },
    });

    // 7. Record Audit Event
    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        entityType: 'BrandDocument',
        entityId: document.id,
        action: 'DOCUMENT_UPLOADED',
        meta: {
          fileName,
          sizeBytes,
          itemsExtracted: knowledgeItems.length,
        },
      },
    });

    return res.status(201).json({
      status: 'success',
      data: {
        document: updatedDoc,
        itemsCount: knowledgeItems.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/brand-documents
 * Lists all documents in the workspace
 */
async function listBrandDocuments(req, res, next) {
  try {
    const workspaceId = req.currentMembership.workspaceId;

    const documents = await prisma.brandDocument.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { knowledgeItems: true },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: { documents },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/brand-documents/:id
 * Fetches single document details with a signed download URL
 */
async function getBrandDocument(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.currentMembership.workspaceId;

    const document = await prisma.brandDocument.findFirst({
      where: { id, workspaceId },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        knowledgeItems: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        error: { code: 'NOT_FOUND', message: 'Document not found in current workspace' },
      });
    }

    const downloadUrl = await getSignedUrl(document.storagePath, 60);

    return res.status(200).json({
      status: 'success',
      data: {
        ...document,
        downloadUrl,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/brand-documents/:id
 * Admin deletes a document and linked storage
 */
async function deleteBrandDocument(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.currentMembership.workspaceId;
    const userId = req.user.id;

    const document = await prisma.brandDocument.findFirst({
      where: { id, workspaceId },
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      });
    }

    // Delete storage file
    await deleteDocument(document.storagePath);

    // Delete database record (cascades or cleans items)
    await prisma.brandDocument.delete({
      where: { id },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        entityType: 'BrandDocument',
        entityId: id,
        action: 'DOCUMENT_DELETED',
        meta: { fileName: document.fileName },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Document deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  upload,
  uploadBrandDocument,
  listBrandDocuments,
  getBrandDocument,
  deleteBrandDocument,
};
