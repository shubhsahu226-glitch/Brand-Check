const prisma = require('../lib/prisma');
const { scoped } = require('../middleware/auth');
const {
  demoDraftsStore,
  demoRulesStore,
  demoActivityStore,
} = require('../lib/mockStore');

/**
 * GET /api/workspaces/current
 * Returns current workspace details and member count.
 */
async function getCurrentWorkspace(req, res, next) {
  try {
    const { workspaceId, role } = scoped(req);

    let workspace;
    let membersCount = 1;
    try {
      workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      membersCount = await prisma.membership.count({
        where: { workspaceId },
      });
    } catch (_dbErr) {
      workspace = {
        id: workspaceId || 'demo_workspace_acme',
        name: 'Acme Brand (Demo Workspace)',
      };
      membersCount = 3;
    }

    return res.status(200).json({
      status: 'success',
      data: {
        workspace,
        role,
        membersCount,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/workspaces/analytics
 * Returns aggregated compliance insights, status breakdowns, violation stats, and activity.
 */
async function getWorkspaceAnalytics(req, res, next) {
  try {
    const { workspaceId } = scoped(req);

    let totalDrafts = 0;
    let draftsByStatus = [];
    let totalRules = 0;
    let approvedRules = 0;
    let recentAuditEvents = [];
    let suggestions = [];
    let scoredDrafts = [];

    try {
      const resData = await Promise.all([
        prisma.draft.count({ where: { workspaceId } }),
        prisma.draft.groupBy({
          by: ['status'],
          where: { workspaceId },
          _count: { status: true },
        }),
        prisma.knowledgeItem.count({ where: { workspaceId } }),
        prisma.knowledgeItem.count({
          where: { workspaceId, status: 'APPROVED' },
        }),
        prisma.auditEvent.findMany({
          where: { workspaceId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            actor: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.draftSuggestion.findMany({
          where: { draft: { workspaceId } },
          select: {
            category: true,
            severity: true,
            status: true,
          },
        }),
        prisma.draft.findMany({
          where: {
            workspaceId,
            complianceScore: { not: null },
          },
          select: { complianceScore: true },
        }),
      ]);

      totalDrafts = resData[0];
      draftsByStatus = resData[1];
      totalRules = resData[2];
      approvedRules = resData[3];
      recentAuditEvents = resData[4];
      suggestions = resData[5];
      scoredDrafts = resData[6];
    } catch (_dbErr) {
      totalDrafts = demoDraftsStore.length;
      totalRules = demoRulesStore.length;
      approvedRules = demoRulesStore.filter((r) => r.status === 'APPROVED').length;
      recentAuditEvents = demoActivityStore;

      const grouped = {};
      for (const d of demoDraftsStore) {
        grouped[d.status] = (grouped[d.status] || 0) + 1;
        if (d.suggestions) {
          suggestions.push(...d.suggestions);
        }
        if (d.complianceScore !== null && d.complianceScore !== undefined) {
          scoredDrafts.push({ complianceScore: d.complianceScore });
        }
      }

      draftsByStatus = Object.entries(grouped).map(([status, count]) => ({
        status,
        _count: { status: count },
      }));
    }

    // Status distribution
    const statusCounts = {
      DRAFT: 0,
      IN_REVIEW: 0,
      CHANGES_REQUESTED: 0,
      APPROVED: 0,
    };
    for (const group of draftsByStatus) {
      statusCounts[group.status] = group._count.status;
    }

    const avgComplianceScore =
      scoredDrafts.length > 0
        ? Math.round(
            scoredDrafts.reduce((sum, d) => sum + d.complianceScore, 0) /
              scoredDrafts.length
          )
        : 100;

    // Category and Severity distributions
    const categoryCounts = {};
    const severityCounts = { ERROR: 0, WARNING: 0, INFO: 0 };
    const resolutionCounts = { PENDING: 0, ACCEPTED: 0, DISMISSED: 0 };

    for (const s of suggestions) {
      categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
      if (severityCounts[s.severity] !== undefined) {
        severityCounts[s.severity]++;
      }
      if (resolutionCounts[s.status] !== undefined) {
        resolutionCounts[s.status]++;
      }
    }

    const topViolations = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalDecided = resolutionCounts.ACCEPTED + resolutionCounts.DISMISSED;
    const acceptanceRate =
      totalDecided > 0
        ? Math.round((resolutionCounts.ACCEPTED / totalDecided) * 100)
        : 100;

    return res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalDrafts,
          approvedDrafts: statusCounts.APPROVED,
          pendingReview: statusCounts.IN_REVIEW,
          changesRequested: statusCounts.CHANGES_REQUESTED,
          draftInProgress: statusCounts.DRAFT,
          avgComplianceScore,
          acceptanceRate,
          totalRules,
          approvedRules,
          totalFindings: suggestions.length,
        },
        breakdowns: {
          statusCounts,
          severityCounts,
          resolutionCounts,
          topViolations,
        },
        recentActivity: recentAuditEvents,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCurrentWorkspace,
  getWorkspaceAnalytics,
};
