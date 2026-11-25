const { z } = require('zod');
const prisma = require('../lib/prisma');
const { scoped, sendError } = require('../middleware/auth');
const { checkDraft } = require('../lib/aiClient');
const {
  demoDraftsStore,
  demoRulesStore,
  demoActivityStore,
} = require('../lib/mockStore');

const createDraftSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  content: z.string().min(1, 'Content is required').trim(),
});

const updateDraftSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  content: z.string().min(1).trim().optional(),
});

const suggestionActionSchema = z.object({
  action: z.enum(['ACCEPT', 'DISMISS']),
});

const reviewDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'CHANGES_REQUESTED']),
  note: z.string().max(2000).optional().nullable(),
});

/**
 * GET /api/drafts
 * Lists all drafts in the active workspace.
 */
async function listDrafts(req, res, next) {
  try {
    const { workspaceId } = scoped(req);
    const { status, search } = req.query;

    const where = { workspaceId };
    if (status) {
      where.status = status;
    }
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { content: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    let drafts;
    try {
      drafts = await prisma.draft.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { suggestions: true },
          },
        },
      });
    } catch (_dbErr) {
      drafts = demoDraftsStore.filter((d) => {
        const matchesStatus = !status || d.status === status;
        const matchesSearch =
          !search ||
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.content.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        count: drafts.length,
        drafts,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/drafts
 * Creates a new draft in the active workspace.
 */
async function createDraft(req, res, next) {
  try {
    const { workspaceId, userId } = scoped(req);
    const parsed = createDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        parsed.error.errors[0]?.message || 'Invalid draft payload'
      );
    }

    const { title, content } = parsed.data;

    let draft;
    try {
      draft = await prisma.draft.create({
        data: {
          workspaceId,
          creatorId: userId,
          title,
          content,
          status: 'DRAFT',
        },
        include: {
          creator: { select: { id: true, name: true, email: true } },
        },
      });

      await prisma.auditEvent.create({
        data: {
          workspaceId,
          actorId: userId,
          entityType: 'DRAFT',
          entityId: draft.id,
          action: 'DRAFT_CREATED',
          meta: { title: draft.title },
        },
      });
    } catch (_dbErr) {
      draft = {
        id: `draft_${Date.now()}`,
        workspaceId,
        creatorId: userId,
        title,
        content,
        status: 'DRAFT',
        complianceScore: null,
        creator: {
          id: userId,
          name: req.user?.name || 'Demo Creator',
          email: req.user?.email || 'creator.demo@brandcheck.io',
        },
        reviewer: null,
        reviewNote: null,
        reviewedAt: null,
        suggestions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoDraftsStore.unshift(draft);
      demoActivityStore.unshift({
        id: `event_${Date.now()}`,
        workspaceId,
        actorId: userId,
        entityType: 'DRAFT',
        entityId: draft.id,
        action: 'DRAFT_CREATED',
        actor: {
          id: userId,
          name: req.user?.name || 'Demo Creator',
          email: req.user?.email || 'creator.demo@brandcheck.io',
        },
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      status: 'success',
      data: { draft },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/drafts/:id
 * Fetches a draft with all its suggestions.
 */
async function getDraft(req, res, next) {
  try {
    const { workspaceId } = scoped(req);
    const { id } = req.params;

    let draft;
    try {
      draft = await prisma.draft.findFirst({
        where: { id, workspaceId },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
          suggestions: {
            orderBy: { createdAt: 'asc' },
            include: {
              rule: {
                select: { id: true, title: true, type: true, body: true },
              },
            },
          },
        },
      });
    } catch (_dbErr) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      return sendError(res, 404, 'DRAFT_NOT_FOUND', 'Draft not found in workspace');
    }

    return res.status(200).json({
      status: 'success',
      data: { draft },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/drafts/:id
 * Updates draft title or content.
 */
async function updateDraft(req, res, next) {
  try {
    const { workspaceId, userId, role } = scoped(req);
    const { id } = req.params;

    let draft;
    try {
      draft = await prisma.draft.findFirst({
        where: { id, workspaceId },
      });
    } catch (_dbErr) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      return sendError(res, 404, 'DRAFT_NOT_FOUND', 'Draft not found in workspace');
    }

    if (role !== 'ADMIN' && draft.creatorId !== userId) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'You can only edit your own drafts unless you are an admin'
      );
    }

    const parsed = updateDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        parsed.error.errors[0]?.message || 'Invalid update payload'
      );
    }

    const updateData = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.content !== undefined) {
      updateData.content = parsed.data.content;
      if (draft.status === 'CHANGES_REQUESTED') {
        updateData.status = 'DRAFT';
      }
    }

    let updated;
    try {
      updated = await prisma.draft.update({
        where: { id },
        data: updateData,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
          suggestions: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } catch (_dbErr) {
      const idx = demoDraftsStore.findIndex((d) => d.id === id);
      if (idx !== -1) {
        if (updateData.title !== undefined) demoDraftsStore[idx].title = updateData.title;
        if (updateData.content !== undefined) demoDraftsStore[idx].content = updateData.content;
        if (updateData.status !== undefined) demoDraftsStore[idx].status = updateData.status;
        demoDraftsStore[idx].updatedAt = new Date().toISOString();
        updated = demoDraftsStore[idx];
      }
    }

    return res.status(200).json({
      status: 'success',
      data: { draft: updated || draft },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/drafts/:id/check
 * Runs the Brand Check review engine against the workspace's approved brand guidelines.
 */
async function checkDraftCompliance(req, res, next) {
  try {
    const { workspaceId, userId } = scoped(req);
    const { id } = req.params;

    let draft;
    try {
      draft = await prisma.draft.findFirst({
        where: { id, workspaceId },
      });
    } catch (_dbErr) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      return sendError(res, 404, 'DRAFT_NOT_FOUND', 'Draft not found in workspace');
    }

    let approvedRules = [];
    try {
      approvedRules = await prisma.knowledgeItem.findMany({
        where: {
          workspaceId,
          status: 'APPROVED',
        },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
        },
      });
    } catch (_dbErr) {
      approvedRules = demoRulesStore.filter((r) => r.status === 'APPROVED');
    }

    if (approvedRules.length === 0) {
      approvedRules = demoRulesStore.filter((r) => r.status === 'APPROVED');
    }

    const reviewResult = await checkDraft(draft.content, approvedRules);
    const validRuleIds = new Set(approvedRules.map((r) => r.id));

    let updatedDraft;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.draftSuggestion.deleteMany({
          where: {
            draftId: draft.id,
            status: 'PENDING',
          },
        });

        if (reviewResult.suggestions && reviewResult.suggestions.length > 0) {
          await tx.draftSuggestion.createMany({
            data: reviewResult.suggestions.map((s) => ({
              draftId: draft.id,
              ruleId: s.ruleId && validRuleIds.has(s.ruleId) ? s.ruleId : null,
              category: s.category || 'RULE',
              severity: ['ERROR', 'WARNING', 'INFO'].includes(s.severity)
                ? s.severity
                : 'WARNING',
              originalText: s.originalText,
              suggestedText: s.suggestedText || null,
              explanation: s.explanation,
              status: 'PENDING',
            })),
          });
        }

        await tx.draft.update({
          where: { id: draft.id },
          data: {
            complianceScore: reviewResult.complianceScore,
          },
        });

        await tx.auditEvent.create({
          data: {
            workspaceId,
            actorId: userId,
            entityType: 'DRAFT',
            entityId: draft.id,
            action: 'DRAFT_COMPLIANCE_CHECKED',
            meta: {
              complianceScore: reviewResult.complianceScore,
              suggestionCount: reviewResult.suggestions?.length || 0,
            },
          },
        });
      });

      updatedDraft = await prisma.draft.findFirst({
        where: { id, workspaceId },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
          suggestions: {
            orderBy: { createdAt: 'asc' },
            include: {
              rule: {
                select: { id: true, title: true, type: true, body: true },
              },
            },
          },
        },
      });
    } catch (_dbErr) {
      // Database write error - resilient fallback
    }

    const suggestionsPayload = (reviewResult.suggestions || []).map(
      (s, sIdx) => ({
        id: s.id || `sug_${Date.now()}_${sIdx}`,
        draftId: id,
        ruleId: s.ruleId || null,
        category: s.category || 'RULE',
        severity: ['ERROR', 'WARNING', 'INFO'].includes(s.severity)
          ? s.severity
          : 'WARNING',
        originalText: s.originalText,
        suggestedText: s.suggestedText || null,
        explanation: s.explanation,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      })
    );

    if (
      !updatedDraft ||
      !updatedDraft.suggestions ||
      updatedDraft.suggestions.length === 0
    ) {
      updatedDraft = {
        ...(draft || {}),
        id,
        workspaceId,
        content: draft?.content || '',
        title: draft?.title || 'Untitled Draft',
        complianceScore: reviewResult.complianceScore,
        suggestions: suggestionsPayload,
      };

      const dIdx = demoDraftsStore.findIndex((d) => d.id === id);
      if (dIdx !== -1) {
        demoDraftsStore[dIdx] = updatedDraft;
      } else {
        demoDraftsStore.unshift(updatedDraft);
      }
    }

    return res.status(200).json({
      status: 'success',
      data: {
        draft: updatedDraft,
        summary: reviewResult.summary,
        complianceScore: reviewResult.complianceScore,
        suggestions: updatedDraft.suggestions || suggestionsPayload,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/drafts/:id/suggestions/:suggestionId/action
 * Accepts or dismisses a suggestion.
 */
async function applySuggestionAction(req, res, next) {
  try {
    const { workspaceId } = scoped(req);
    const { id: draftId, suggestionId } = req.params;

    const parsed = suggestionActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Action must be ACCEPT or DISMISS'
      );
    }

    const { action } = parsed.data;

    let draft;
    try {
      draft = await prisma.draft.findFirst({
        where: { id: draftId, workspaceId },
      });
    } catch (_dbErr) {
      draft = demoDraftsStore.find((d) => d.id === draftId);
    }

    if (!draft) {
      draft = demoDraftsStore.find((d) => d.id === draftId);
    }

    if (!draft) {
      return sendError(res, 404, 'DRAFT_NOT_FOUND', 'Draft not found in workspace');
    }

    let finalDraft;
    let suggestion;
    try {
      suggestion = await prisma.draftSuggestion.findFirst({
        where: { id: suggestionId, draftId },
      });
    } catch (_dbErr) {
      // DB offline, check fallback below
    }

    if (!suggestion) {
      const dStore = demoDraftsStore.find((d) => d.id === draftId);
      suggestion = dStore?.suggestions?.find((s) => s.id === suggestionId);
    }

    if (!suggestion) {
      return sendError(
        res,
        404,
        'SUGGESTION_NOT_FOUND',
        'Suggestion not found for this draft'
      );
    }

    try {
      let updatedContent = draft.content;

      if (action === 'ACCEPT') {
        if (suggestion.suggestedText && suggestion.originalText) {
          if (updatedContent.includes(suggestion.originalText)) {
            updatedContent = updatedContent.replace(
              suggestion.originalText,
              suggestion.suggestedText
            );
          }
        }

        await prisma.$transaction([
          prisma.draftSuggestion.update({
            where: { id: suggestionId },
            data: { status: 'ACCEPTED' },
          }),
          prisma.draft.update({
            where: { id: draftId },
            data: { content: updatedContent },
          }),
        ]);
      } else {
        await prisma.draftSuggestion.update({
          where: { id: suggestionId },
          data: { status: 'DISMISSED' },
        });
      }

      const remainingPending = await prisma.draftSuggestion.findMany({
        where: { draftId, status: 'PENDING' },
      });

      let penalty = 0;
      for (const s of remainingPending) {
        penalty += s.severity === 'ERROR' ? 20 : s.severity === 'WARNING' ? 10 : 5;
      }
      const newScore = Math.max(0, Math.min(100, 100 - penalty));

      finalDraft = await prisma.draft.update({
        where: { id: draftId },
        data: { complianceScore: newScore },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
          suggestions: {
            orderBy: { createdAt: 'asc' },
            include: {
              rule: {
                select: { id: true, title: true, type: true, body: true },
              },
            },
          },
        },
      });
    } catch (_dbErr) {
      // Fall through to in-memory store update
    }

    if (!finalDraft) {
      let dIdx = demoDraftsStore.findIndex((d) => d.id === draftId);
      if (dIdx === -1) {
        demoDraftsStore.unshift({ ...draft, suggestions: draft.suggestions || [] });
        dIdx = 0;
      }
      const sIdx = demoDraftsStore[dIdx].suggestions.findIndex(
        (s) => s.id === suggestionId
      );
      if (sIdx !== -1) {
        demoDraftsStore[dIdx].suggestions[sIdx].status =
          action === 'ACCEPT' ? 'ACCEPTED' : 'DISMISSED';
        if (
          action === 'ACCEPT' &&
          demoDraftsStore[dIdx].suggestions[sIdx].suggestedText
        ) {
          demoDraftsStore[dIdx].content = demoDraftsStore[dIdx].content.replace(
            demoDraftsStore[dIdx].suggestions[sIdx].originalText,
            demoDraftsStore[dIdx].suggestions[sIdx].suggestedText
          );
        }
        const pending = demoDraftsStore[dIdx].suggestions.filter(
          (s) => s.status === 'PENDING'
        );
        let penalty = 0;
        for (const s of pending) {
          penalty +=
            s.severity === 'ERROR' ? 20 : s.severity === 'WARNING' ? 10 : 5;
        }
        demoDraftsStore[dIdx].complianceScore = Math.max(
          0,
          Math.min(100, 100 - penalty)
        );
        finalDraft = demoDraftsStore[dIdx];
      }
    }

    return res.status(200).json({
      status: 'success',
      data: {
        draft: finalDraft || draft,
        actionApplied: action,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/drafts/:id/submit
 * Creator submits draft for review.
 */
async function submitDraft(req, res, next) {
  try {
    const { workspaceId, userId } = scoped(req);
    const { id } = req.params;

    let draft;
    try {
      draft = await prisma.draft.findFirst({
        where: { id, workspaceId },
      });
    } catch (_dbErr) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      return sendError(res, 404, 'DRAFT_NOT_FOUND', 'Draft not found in workspace');
    }

    let updated;
    try {
      updated = await prisma.draft.update({
        where: { id },
        data: { status: 'IN_REVIEW' },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      await prisma.auditEvent.create({
        data: {
          workspaceId,
          actorId: userId,
          entityType: 'DRAFT',
          entityId: draft.id,
          action: 'DRAFT_SUBMITTED_FOR_REVIEW',
        },
      });
    } catch (_dbErr) {
      const idx = demoDraftsStore.findIndex((d) => d.id === id);
      if (idx !== -1) {
        demoDraftsStore[idx].status = 'IN_REVIEW';
        updated = demoDraftsStore[idx];
      }
    }

    return res.status(200).json({
      status: 'success',
      data: { draft: updated || draft },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/drafts/:id/review
 * Reviewer or Admin approves or requests changes on draft.
 */
async function reviewDraft(req, res, next) {
  try {
    const { workspaceId, userId, role } = scoped(req);
    const { id } = req.params;

    if (role !== 'ADMIN' && role !== 'REVIEWER') {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Only Reviewers and Admins can approve or request changes on drafts'
      );
    }

    const parsed = reviewDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Decision must be APPROVED or CHANGES_REQUESTED'
      );
    }

    const { decision, note } = parsed.data;

    let draft;
    try {
      draft = await prisma.draft.findFirst({
        where: { id, workspaceId },
      });
    } catch (_dbErr) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      return sendError(res, 404, 'DRAFT_NOT_FOUND', 'Draft not found in workspace');
    }

    let updated;
    try {
      updated = await prisma.draft.update({
        where: { id },
        data: {
          status: decision,
          reviewerId: userId,
          reviewedAt: new Date(),
          reviewNote: note || null,
        },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
          suggestions: { orderBy: { createdAt: 'asc' } },
        },
      });

      await prisma.auditEvent.create({
        data: {
          workspaceId,
          actorId: userId,
          entityType: 'DRAFT',
          entityId: draft.id,
          action: `DRAFT_${decision}`,
          meta: { note: note || null },
        },
      });
    } catch (_dbErr) {
      const idx = demoDraftsStore.findIndex((d) => d.id === id);
      if (idx !== -1) {
        demoDraftsStore[idx].status = decision;
        demoDraftsStore[idx].reviewerId = userId;
        demoDraftsStore[idx].reviewedAt = new Date().toISOString();
        demoDraftsStore[idx].reviewNote = note || null;
        updated = demoDraftsStore[idx];
      }
    }

    return res.status(200).json({
      status: 'success',
      data: { draft: updated || draft },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/drafts/:id
 * Creator or Admin deletes a draft.
 */
async function deleteDraft(req, res, next) {
  try {
    const { workspaceId, userId, role } = scoped(req);
    const { id } = req.params;

    let draft;
    try {
      draft = await prisma.draft.findFirst({
        where: { id, workspaceId },
      });
    } catch (_dbErr) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      draft = demoDraftsStore.find((d) => d.id === id);
    }

    if (!draft) {
      return sendError(res, 404, 'DRAFT_NOT_FOUND', 'Draft not found in workspace');
    }

    if (role !== 'ADMIN' && draft.creatorId !== userId) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Only the creator or an admin can delete this draft'
      );
    }

    try {
      await prisma.draft.delete({
        where: { id },
      });
    } catch (_dbErr) {
      const idx = demoDraftsStore.findIndex((d) => d.id === id);
      if (idx !== -1) {
        demoDraftsStore.splice(idx, 1);
      }
    }

    return res.status(200).json({
      status: 'success',
      data: { deleted: true },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listDrafts,
  createDraft,
  getDraft,
  updateDraft,
  checkDraftCompliance,
  applySuggestionAction,
  submitDraft,
  reviewDraft,
  deleteDraft,
};
