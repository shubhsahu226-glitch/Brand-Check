import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import { generateAccessToken } from '../src/lib/tokens';

describe('Phase 2: Knowledge Base CRUD & Approval Pipeline', () => {
  let adminUser, creatorUser;
  let workspaceA, workspaceB;
  let adminToken, creatorToken;
  let sampleDraftItem, sampleApprovedItem;

  beforeAll(async () => {
    // Clean up test data
    await prisma.knowledgeItem.deleteMany({
      where: { title: { contains: 'TestKB' } },
    });
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'kb-test' } } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'KB Test Workspace' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'kb-test' } },
    });

    // Create test users
    adminUser = await prisma.user.create({
      data: {
        email: 'kb-test-admin@brandcheck.io',
        name: 'KB Admin',
        passwordHash: 'dummy',
      },
    });

    creatorUser = await prisma.user.create({
      data: {
        email: 'kb-test-creator@brandcheck.io',
        name: 'KB Creator',
        passwordHash: 'dummy',
      },
    });

    // Create Workspace A
    workspaceA = await prisma.workspace.create({
      data: {
        name: 'KB Test Workspace A',
        createdById: adminUser.id,
      },
    });

    // Create Workspace B (for multi-tenant isolation test)
    workspaceB = await prisma.workspace.create({
      data: {
        name: 'KB Test Workspace B',
        createdById: adminUser.id,
      },
    });

    // Memberships
    await prisma.membership.create({
      data: {
        userId: adminUser.id,
        workspaceId: workspaceA.id,
        role: 'ADMIN',
      },
    });

    await prisma.membership.create({
      data: {
        userId: creatorUser.id,
        workspaceId: workspaceA.id,
        role: 'CREATOR',
      },
    });

    // Access Tokens
    adminToken = generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'ADMIN',
      workspaceId: workspaceA.id,
    });

    creatorToken = generateAccessToken({
      userId: creatorUser.id,
      email: creatorUser.email,
      role: 'CREATOR',
      workspaceId: workspaceA.id,
    });

    // Seed sample items in Workspace A
    sampleDraftItem = await prisma.knowledgeItem.create({
      data: {
        workspaceId: workspaceA.id,
        type: 'RULE',
        title: 'TestKB Draft Rule: Avoid Slang',
        body: 'Do not use slang words in corporate customer communications.',
        status: 'DRAFT',
        source: 'EXTRACTED',
        sourceQuote: 'Never use informal slang in formal messaging.',
        sourcePage: 2,
        confidence: 0.95,
        createdById: adminUser.id,
      },
    });

    sampleApprovedItem = await prisma.knowledgeItem.create({
      data: {
        workspaceId: workspaceA.id,
        type: 'TONE',
        title: 'TestKB Approved Tone: Empathetic Voice',
        body: 'Speak with empathy, honesty, and transparency.',
        status: 'APPROVED',
        source: 'MANUAL',
        createdById: adminUser.id,
        approvedById: adminUser.id,
        approvedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.knowledgeItem.deleteMany({
      where: { title: { contains: 'TestKB' } },
    });
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'kb-test' } } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'KB Test Workspace' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'kb-test' } },
    });
  });

  it('GET /api/knowledge as ADMIN returns both DRAFT and APPROVED items', async () => {
    const res = await request(app)
      .get('/api/knowledge')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.items).toBeDefined();

    const titles = res.body.data.items.map((i) => i.title);
    expect(titles).toContain(sampleDraftItem.title);
    expect(titles).toContain(sampleApprovedItem.title);
  });

  it('GET /api/knowledge as CREATOR strictly returns ONLY APPROVED items (Role Boundary)', async () => {
    const res = await request(app)
      .get('/api/knowledge')
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    // All items visible to creator must have status APPROVED
    const items = res.body.data.items;
    for (const item of items) {
      expect(item.status).toBe('APPROVED');
    }

    const titles = items.map((i) => i.title);
    expect(titles).toContain(sampleApprovedItem.title);
    expect(titles).not.toContain(sampleDraftItem.title); // DRAFT must be hidden
  });

  it('POST /api/knowledge as ADMIN creates manual brand rule', async () => {
    const res = await request(app)
      .post('/api/knowledge')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'CLAIM',
        title: 'TestKB Verified Claim: 99.9% Uptime',
        body: 'Our platform maintains 99.9% verified uptime SLA.',
        status: 'APPROVED',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.item.title).toBe('TestKB Verified Claim: 99.9% Uptime');
    expect(res.body.data.item.status).toBe('APPROVED');
    expect(res.body.data.item.source).toBe('MANUAL');
  });

  it('POST /api/knowledge as CREATOR is denied with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post('/api/knowledge')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        type: 'RULE',
        title: 'TestKB Creator Rule Attempt',
        body: 'Creators cannot mutate knowledge items.',
      });

    expect(res.status).toBe(403);
  });

  it('POST /api/knowledge/:id/approve as ADMIN approves draft item (Human-in-the-Loop)', async () => {
    const res = await request(app)
      .post(`/api/knowledge/${sampleDraftItem.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.item.status).toBe('APPROVED');
    expect(res.body.data.item.approvedById).toBe(adminUser.id);
    expect(res.body.data.item.approvedAt).toBeDefined();

    // Now creator should be able to see it
    const creatorCheck = await request(app)
      .get('/api/knowledge')
      .set('Authorization', `Bearer ${creatorToken}`);

    const creatorTitles = creatorCheck.body.data.items.map((i) => i.title);
    expect(creatorTitles).toContain(sampleDraftItem.title);
  });

  it('POST /api/knowledge/:id/disable as ADMIN disables approved rule', async () => {
    const res = await request(app)
      .post(`/api/knowledge/${sampleDraftItem.id}/disable`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.item.status).toBe('DISABLED');
  });

  it('POST /api/knowledge/bulk-approve approves multiple items atomically', async () => {
    // Create 2 draft items
    const item1 = await prisma.knowledgeItem.create({
      data: {
        workspaceId: workspaceA.id,
        type: 'TERM_BANNED',
        title: 'TestKB Bulk Draft 1',
        body: 'Do not use term X',
        status: 'DRAFT',
      },
    });

    const item2 = await prisma.knowledgeItem.create({
      data: {
        workspaceId: workspaceA.id,
        type: 'TERM_APPROVED',
        title: 'TestKB Bulk Draft 2',
        body: 'Use term Y',
        status: 'DRAFT',
      },
    });

    const res = await request(app)
      .post('/api/knowledge/bulk-approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ itemIds: [item1.id, item2.id] });

    expect(res.status).toBe(200);
    expect(res.body.data.approvedCount).toBe(2);

    // Verify in DB
    const check1 = await prisma.knowledgeItem.findUnique({ where: { id: item1.id } });
    const check2 = await prisma.knowledgeItem.findUnique({ where: { id: item2.id } });
    expect(check1.status).toBe('APPROVED');
    expect(check2.status).toBe('APPROVED');
  });

  it('Multi-tenant check: Admin in Workspace B cannot access or mutate Workspace A items', async () => {
    // Create admin user exclusively in Workspace B
    const adminUserB = await prisma.user.create({
      data: {
        email: 'kb-test-admin-b@brandcheck.io',
        name: 'KB Admin B',
        passwordHash: 'dummy',
      },
    });

    await prisma.membership.create({
      data: {
        userId: adminUserB.id,
        workspaceId: workspaceB.id,
        role: 'ADMIN',
      },
    });

    const tokenWorkspaceB = generateAccessToken({
      userId: adminUserB.id,
      email: adminUserB.email,
      role: 'ADMIN',
      workspaceId: workspaceB.id,
    });

    // Trying to approve item from Workspace A with Workspace B admin
    const res = await request(app)
      .post(`/api/knowledge/${sampleDraftItem.id}/approve`)
      .set('Authorization', `Bearer ${tokenWorkspaceB}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
