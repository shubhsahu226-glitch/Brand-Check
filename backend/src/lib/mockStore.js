const demoDraftsStore = [
  {
    id: 'draft_demo_sample_1',
    workspaceId: 'demo_workspace_acme',
    creatorId: 'demo_creator_user',
    title: 'BrandCheck Product Launch Copy',
    content:
      'Upgrade your team from LegacyApp today! BrandCheck is the best in the world brand compliance solution with 100% guaranteed adherence.',
    status: 'DRAFT',
    complianceScore: null,
    creator: {
      id: 'demo_creator_user',
      name: 'Demo Creator',
      email: 'creator.demo@brandcheck.io',
    },
    reviewer: null,
    reviewNote: null,
    reviewedAt: null,
    suggestions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const demoRulesStore = [
  {
    id: 'rule_demo_1',
    workspaceId: 'demo_workspace_acme',
    type: 'TERM_BANNED',
    title: 'Banned Term: LegacyApp',
    body: 'Never use the term "LegacyApp". Use BrandCheck instead.',
    status: 'APPROVED',
    source: 'MANUAL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule_demo_2',
    workspaceId: 'demo_workspace_acme',
    type: 'TONE',
    title: 'Voice & Tone: Clear & Professional',
    body: 'Maintain a clear, transparent, and authoritative voice. Avoid exaggerated superlatives.',
    status: 'APPROVED',
    source: 'MANUAL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule_demo_3',
    workspaceId: 'demo_workspace_acme',
    type: 'CLAIM',
    title: 'Verified Performance Claims',
    body: 'All marketing claims must cite audited data benchmarks. Do not claim absolute superlatives.',
    status: 'APPROVED',
    source: 'MANUAL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const demoActivityStore = [
  {
    id: 'event_demo_1',
    workspaceId: 'demo_workspace_acme',
    actorId: 'demo_admin_user',
    entityType: 'KNOWLEDGE_RULE',
    entityId: 'rule_demo_1',
    action: 'RULE_APPROVED',
    actor: {
      id: 'demo_admin_user',
      name: 'Demo Admin',
      email: 'admin.demo@brandcheck.io',
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'event_demo_2',
    workspaceId: 'demo_workspace_acme',
    actorId: 'demo_creator_user',
    entityType: 'DRAFT',
    entityId: 'draft_demo_sample_1',
    action: 'DRAFT_CREATED',
    actor: {
      id: 'demo_creator_user',
      name: 'Demo Creator',
      email: 'creator.demo@brandcheck.io',
    },
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

module.exports = {
  demoDraftsStore,
  demoRulesStore,
  demoActivityStore,
};
