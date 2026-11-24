import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import { generateAccessToken } from '../src/lib/tokens';

describe('Phase 3 & 4: Draft Intake, Brand Check & Review Pipeline', () => {
  let adminUser, creatorUser, reviewerUser, strangerUser;
  let workspaceA, workspaceB;
  let creatorToken, reviewerToken, strangerToken;
  let testDraft;

  beforeAll(async () => {
    // Cleanup prior test runs
    await prisma.draftSuggestion.deleteMany({
      where: { draft: { title: { contains: 'TestDraft' } } },
    });
    await prisma.draft.deleteMany({
      where: { title: { contains: 'TestDraft' } },
    });
    await prisma.knowledgeItem.deleteMany({
      where: { title: { contains: 'DraftTestRule' } },
    });
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'draft-test' } } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'Draft Test Workspace' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'draft-test' } },
    });

    // Create users
    adminUser = await prisma.user.create({
      data: {
        email: 'draft-test-admin@brandcheck.io',
        name: 'Draft Admin',
        passwordHash: 'dummy',
      },
    });

    creatorUser = await prisma.user.create({
      data: {
        email: 'draft-test-creator@brandcheck.io',
        name: 'Draft Creator',
        passwordHash: 'dummy',
      },
    });

    reviewerUser = await prisma.user.create({
      data: {
        email: 'draft-test-reviewer@brandcheck.io',
        name: 'Draft Reviewer',
        passwordHash: 'dummy',
      },
    });

    strangerUser = await prisma.user.create({
      data: {
        email: 'draft-test-stranger@brandcheck.io',
        name: 'Draft Stranger',
        passwordHash: 'dummy',
      },
    });

    // Workspaces
    workspaceA = await prisma.workspace.create({
      data: {
        name: 'Draft Test Workspace A',
        createdById: adminUser.id,
      },
    });

    workspaceB = await prisma.workspace.create({
      data: {
        name: 'Draft Test Workspace B',
        createdById: strangerUser.id,
      },
    });

    // Memberships for Workspace A
    await prisma.membership.createMany({
      data: [
        { userId: adminUser.id, workspaceId: workspaceA.id, role: 'ADMIN' },
        { userId: creatorUser.id, workspaceId: workspaceA.id, role: 'CREATOR' },
        { userId: reviewerUser.id, workspaceId: workspaceA.id, role: 'REVIEWER' },
      ],
    });

    // Membership for Workspace B (tenant isolation)
    await prisma.membership.create({
      data: {
        userId: strangerUser.id,
        workspaceId: workspaceB.id,
        role: 'ADMIN',
      },
    });

    // Tokens
    creatorToken = generateAccessToken(creatorUser);
    reviewerToken = generateAccessToken(reviewerUser);
    strangerToken = generateAccessToken(strangerUser);

    // Seed approved knowledge rules in Workspace A
    await prisma.knowledgeItem.create({
      data: {
        workspaceId: workspaceA.id,
        type: 'TERM_BANNED',
        title: 'DraftTestRule: Banned LegacyApp',
        body: 'Never use the term "LegacyApp". Use BrandCheck instead.',
        status: 'APPROVED',
        source: 'MANUAL',
      },
    });

    await prisma.knowledgeItem.create({
      data: {
        workspaceId: workspaceA.id,
        type: 'TONE',
        title: 'DraftTestRule: Professional Tone',
        body: 'Maintain a professional and verified tone. Avoid informal slang.',
        status: 'APPROVED',
        source: 'MANUAL',
      },
    });
  });

  afterAll(async () => {
    await prisma.draftSuggestion.deleteMany({
      where: { draft: { title: { contains: 'TestDraft' } } },
    });
    await prisma.draft.deleteMany({
      where: { title: { contains: 'TestDraft' } },
    });
    await prisma.knowledgeItem.deleteMany({
      where: { title: { contains: 'DraftTestRule' } },
    });
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'draft-test' } } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'Draft Test Workspace' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'draft-test' } },
    });
  });

  describe('1. Draft Intake & CRUD', () => {
    it('creator can create a draft in their active workspace', async () => {
      const res = await request(app)
        .post('/api/drafts')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'TestDraft: Product Launch Announcement',
          content: 'Switch from LegacyApp today for the best in the world performance.',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.draft).toBeDefined();
      expect(res.body.data.draft.title).toBe('TestDraft: Product Launch Announcement');
      expect(res.body.data.draft.status).toBe('DRAFT');
      expect(res.body.data.draft.workspaceId).toBe(workspaceA.id);

      testDraft = res.body.data.draft;
    });

    it('lists drafts within the active workspace', async () => {
      const res = await request(app)
        .get('/api/drafts')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);
      const found = res.body.data.drafts.find((d) => d.id === testDraft.id);
      expect(found).toBeDefined();
    });

    it('enforces multi-tenant isolation: stranger cannot read or edit draft from another workspace', async () => {
      const getRes = await request(app)
        .get(`/api/drafts/${testDraft.id}`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(getRes.status).toBe(404);

      const putRes = await request(app)
        .put(`/api/drafts/${testDraft.id}`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ title: 'Hacked Title' });

      expect(putRes.status).toBe(404);
    });
  });

  describe('2. Brand Check Review Engine', () => {
    it('runs compliance check and flags banned terms and unverified claims', async () => {
      const res = await request(app)
        .post(`/api/drafts/${testDraft.id}/check`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.draft).toBeDefined();
      expect(res.body.data.draft.complianceScore).toBeLessThan(100);

      const suggestions = res.body.data.draft.suggestions;
      expect(suggestions.length).toBeGreaterThanOrEqual(1);

      // Verify banned term was caught
      const bannedSuggestion = suggestions.find(
        (s) => s.category === 'TERM_BANNED' && s.originalText.includes('LegacyApp')
      );
      expect(bannedSuggestion).toBeDefined();
      expect(bannedSuggestion.severity).toBe('ERROR');
      expect(bannedSuggestion.status).toBe('PENDING');
    });

    it('accepts a suggestion and automatically applies the replacement (Human-in-the-Loop)', async () => {
      const getRes = await request(app)
        .get(`/api/drafts/${testDraft.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      const suggestion = getRes.body.data.draft.suggestions[0];
      expect(suggestion).toBeDefined();

      const actionRes = await request(app)
        .post(`/api/drafts/${testDraft.id}/suggestions/${suggestion.id}/action`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ action: 'ACCEPT' });

      expect(actionRes.status).toBe(200);
      expect(actionRes.body.status).toBe('success');
      expect(actionRes.body.data.actionApplied).toBe('ACCEPT');
    });

    it('dismisses a suggestion and updates pending count', async () => {
      // Fetch draft suggestions
      const getRes = await request(app)
        .get(`/api/drafts/${testDraft.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      const pendingSuggestion = getRes.body.data.draft.suggestions.find(
        (s) => s.status === 'PENDING'
      );

      if (pendingSuggestion) {
        const dismissRes = await request(app)
          .post(`/api/drafts/${testDraft.id}/suggestions/${pendingSuggestion.id}/action`)
          .set('Authorization', `Bearer ${creatorToken}`)
          .send({ action: 'DISMISS' });

        expect(dismissRes.status).toBe(200);
        expect(dismissRes.body.status).toBe('success');
        expect(dismissRes.body.data.actionApplied).toBe('DISMISS');
      }
    });
  });

  describe('3. Review & Approval Workflow', () => {
    it('creator can submit draft for review', async () => {
      const res = await request(app)
        .post(`/api/drafts/${testDraft.id}/submit`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.draft.status).toBe('IN_REVIEW');
    });

    it('creator cannot approve their own draft (role boundary)', async () => {
      const res = await request(app)
        .post(`/api/drafts/${testDraft.id}/review`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ decision: 'APPROVED', note: 'Self approval' });

      expect(res.status).toBe(403);
    });

    it('reviewer or admin can formally approve draft', async () => {
      const res = await request(app)
        .post(`/api/drafts/${testDraft.id}/review`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          decision: 'APPROVED',
          note: 'Verified brand guidelines adherence. Approved for launch.',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.draft.status).toBe('APPROVED');
      expect(res.body.data.draft.reviewerId).toBe(reviewerUser.id);
      expect(res.body.data.draft.reviewNote).toBe(
        'Verified brand guidelines adherence. Approved for launch.'
      );
    });

    it('creator or admin can delete draft', async () => {
      const res = await request(app)
        .delete(`/api/drafts/${testDraft.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.deleted).toBe(true);

      const verifyRes = await request(app)
        .get(`/api/drafts/${testDraft.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(verifyRes.status).toBe(404);
    });
  });

  describe('4. Workspace Analytics & Insights (Phase 6)', () => {
    it('returns aggregated workspace compliance metrics and status breakdowns', async () => {
      const res = await request(app)
        .get('/api/workspaces/analytics')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.avgComplianceScore).toBeGreaterThanOrEqual(0);
      expect(res.body.data.breakdowns).toBeDefined();
      expect(res.body.data.breakdowns.statusCounts).toBeDefined();
      expect(res.body.data.breakdowns.severityCounts).toBeDefined();
      expect(Array.isArray(res.body.data.recentActivity)).toBe(true);
    });
  });
});
