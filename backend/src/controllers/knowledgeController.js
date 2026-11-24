const { z } = require('zod');
const prisma = require('../lib/prisma');
const { demoRulesStore } = require('../lib/mockStore');

const KNOWLEDGE_TYPES = [
  'RULE',
  'TONE',
  'TERM_APPROVED',
  'TERM_BANNED',
  'FACT',
  'CLAIM',
  'VISUAL',
  'ACCESSIBILITY',
  'DISCLOSURE',
];

const createItemSchema = z.object({
  type: z.enum(KNOWLEDGE_TYPES),
  title: z.string().min(2, 'Title must be at least 2 characters').max(200).trim(),
  body: z.string().min(2, 'Body must be at least 2 characters').max(4000).trim(),
  status: z.enum(['DRAFT', 'APPROVED', 'DISABLED']).optional().default('APPROVED'),
  evidenceUrl: z.string().url().optional().nullable().or(z.literal('')),
  documentId: z.string().optional().nullable(),
});

const updateItemSchema = z.object({
  type: z.enum(KNOWLEDGE_TYPES).optional(),
  title: z.string().min(2).max(200).trim().optional(),
  body: z.string().min(2).max(4000).trim().optional(),
  evidenceUrl: z.string().url().optional().nullable().or(z.literal('')),
});

/**
 * GET /api/knowledge
 * Lists knowledge items.
 * Non-admins (CREATOR, REVIEWER) see ONLY APPROVED items.
 * Admins can filter by any status (DRAFT, APPROVED, DISABLED).
 */
async function listKnowledge(req, res, next) {
  try {
    const workspaceId = req.currentMembership.workspaceId;
    const role = req.currentMembership.role;
    const { type, status, search, documentId } = req.query;

    const where = {
      workspaceId,
    };

    // Role boundary: Non-admins strictly see APPROVED items only
    if (role !== 'ADMIN') {
      where.status = 'APPROVED';
    } else if (status) {
      where.status = status;
    }

    if (type && KNOWLEDGE_TYPES.includes(type)) {
      where.type = type;
    }

    if (documentId) {
      where.documentId = documentId;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { body: { contains: term, mode: 'insensitive' } },
        { sourceQuote: { contains: term, mode: 'insensitive' } },
      ];
    }

    let items;
    try {
      items = await prisma.knowledgeItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          document: { select: { id: true, fileName: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      });
    } catch (_dbErr) {
      items = demoRulesStore.filter((r) => {
        if (role !== 'ADMIN' && r.status !== 'APPROVED') return false;
        if (type && r.type !== type) return false;
        if (status && r.status !== status) return false;
        return true;
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        itemCount: items.length,
        items,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/knowledge
 * Admin manually creates a brand rule or fact
 */
async function createKnowledge(req, res, next) {
  try {
    const parseResult = createItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid knowledge payload',
          details: parseResult.error.errors,
        },
      });
    }

    const workspaceId = req.currentMembership.workspaceId;
    const userId = req.user.id;
    const { type, title, body, status, evidenceUrl, documentId } = parseResult.data;

    const isApproved = status === 'APPROVED';

    const item = await prisma.knowledgeItem.create({
      data: {
        workspaceId,
        type,
        title,
        body,
        status: status || 'APPROVED',
        source: 'MANUAL',
        evidenceUrl: evidenceUrl || null,
        documentId: documentId || null,
        createdById: userId,
        approvedById: isApproved ? userId : null,
        approvedAt: isApproved ? new Date() : null,
      },
    });

    // Record Audit Event
    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        entityType: 'KnowledgeItem',
        entityId: item.id,
        action: 'KNOWLEDGE_CREATED',
        meta: { type, title, status: item.status },
      },
    });

    return res.status(201).json({
      status: 'success',
      data: { item },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/knowledge/:id
 * Admin edits rule title, body, or type
 */
async function updateKnowledge(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.currentMembership.workspaceId;
    const userId = req.user.id;

    const existing = await prisma.knowledgeItem.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'error',
        error: { code: 'NOT_FOUND', message: 'Knowledge item not found in workspace' },
      });
    }

    const parseResult = updateItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid update payload',
        },
      });
    }

    const updated = await prisma.knowledgeItem.update({
      where: { id },
      data: parseResult.data,
    });

    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        entityType: 'KnowledgeItem',
        entityId: id,
        action: 'KNOWLEDGE_UPDATED',
        meta: { previousTitle: existing.title, updatedFields: Object.keys(parseResult.data) },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: { item: updated },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/knowledge/:id/approve
 * Admin approves a draft knowledge item (DRAFT -> APPROVED)
 */
async function approveKnowledge(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.currentMembership.workspaceId;
    const userId = req.user.id;

    const existing = await prisma.knowledgeItem.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'error',
        error: { code: 'NOT_FOUND', message: 'Knowledge item not found in workspace' },
      });
    }

    const updated = await prisma.knowledgeItem.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        entityType: 'KnowledgeItem',
        entityId: id,
        action: 'KNOWLEDGE_APPROVED',
        meta: { title: existing.title, previousStatus: existing.status },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: { item: updated },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/knowledge/:id/disable
 * Admin disables a knowledge item (APPROVED -> DISABLED)
 */
async function disableKnowledge(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.currentMembership.workspaceId;
    const userId = req.user.id;

    const existing = await prisma.knowledgeItem.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'error',
        error: { code: 'NOT_FOUND', message: 'Knowledge item not found in workspace' },
      });
    }

    const updated = await prisma.knowledgeItem.update({
      where: { id },
      data: {
        status: 'DISABLED',
      },
    });

    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        entityType: 'KnowledgeItem',
        entityId: id,
        action: 'KNOWLEDGE_DISABLED',
        meta: { title: existing.title },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: { item: updated },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/knowledge/bulk-approve
 * Admin approves up to 200 items in a single atomic transaction
 */
async function bulkApproveKnowledge(req, res, next) {
  try {
    const { itemIds } = req.body || {};
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: { code: 'VALIDATION_ERROR', message: 'itemIds must be a non-empty array' },
      });
    }

    if (itemIds.length > 200) {
      return res.status(400).json({
        status: 'error',
        error: { code: 'VALIDATION_ERROR', message: 'Cannot bulk approve more than 200 items at once' },
      });
    }

    const workspaceId = req.currentMembership.workspaceId;
    const userId = req.user.id;

    const result = await prisma.knowledgeItem.updateMany({
      where: {
        id: { in: itemIds },
        workspaceId,
      },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        entityType: 'KnowledgeItem',
        entityId: 'bulk',
        action: 'KNOWLEDGE_BULK_APPROVED',
        meta: { count: result.count, requestedIdsCount: itemIds.length },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        approvedCount: result.count,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/knowledge/:id
 * Admin deletes a knowledge item
 */
async function deleteKnowledge(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.currentMembership.workspaceId;
    const userId = req.user.id;

    const existing = await prisma.knowledgeItem.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({
        status: 'error',
        error: { code: 'NOT_FOUND', message: 'Knowledge item not found in workspace' },
      });
    }

    await prisma.knowledgeItem.delete({
      where: { id },
    });

    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        entityType: 'KnowledgeItem',
        entityId: id,
        action: 'KNOWLEDGE_DELETED',
        meta: { title: existing.title },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Knowledge item deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  approveKnowledge,
  disableKnowledge,
  bulkApproveKnowledge,
  deleteKnowledge,
};
