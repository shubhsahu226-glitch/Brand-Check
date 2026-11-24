import { Buffer } from 'node:buffer';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import { generateAccessToken } from '../src/lib/tokens';

describe('Phase 2: Brand Documents Upload & Management Pipeline', () => {
  let adminUser, creatorUser;
  let workspace;
  let adminToken, creatorToken;
  let uploadedDocId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.brandDocument.deleteMany({
      where: { fileName: { contains: 'test-guidelines' } },
    });
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'doc-test' } } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'Doc Test Workspace' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'doc-test' } },
    });

    // Create test users
    adminUser = await prisma.user.create({
      data: {
        email: 'doc-test-admin@brandcheck.io',
        name: 'Doc Admin',
        passwordHash: 'dummy',
      },
    });

    creatorUser = await prisma.user.create({
      data: {
        email: 'doc-test-creator@brandcheck.io',
        name: 'Doc Creator',
        passwordHash: 'dummy',
      },
    });

    // Create Workspace
    workspace = await prisma.workspace.create({
      data: {
        name: 'Doc Test Workspace',
        createdById: adminUser.id,
      },
    });

    // Memberships
    await prisma.membership.create({
      data: {
        userId: adminUser.id,
        workspaceId: workspace.id,
        role: 'ADMIN',
      },
    });

    await prisma.membership.create({
      data: {
        userId: creatorUser.id,
        workspaceId: workspace.id,
        role: 'CREATOR',
      },
    });

    // Access Tokens
    adminToken = generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'ADMIN',
      workspaceId: workspace.id,
    });

    creatorToken = generateAccessToken({
      userId: creatorUser.id,
      email: creatorUser.email,
      role: 'CREATOR',
      workspaceId: workspace.id,
    });
  });

  afterAll(async () => {
    await prisma.brandDocument.deleteMany({
      where: { fileName: { contains: 'test-guidelines' } },
    });
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'doc-test' } } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'Doc Test Workspace' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'doc-test' } },
    });
  });

  it('POST /api/brand-documents as ADMIN uploads document and extracts draft rules', async () => {
    const fileContent = 'Tone of voice: Clear, Empathetic, and Action-oriented.\nBanned words: Avoid slang and misleading jargon.';
    const buffer = Buffer.from(fileContent, 'utf-8');

    const res = await request(app)
      .post('/api/brand-documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', buffer, 'test-guidelines.txt');

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.document).toBeDefined();
    expect(res.body.data.document.fileName).toBe('test-guidelines.txt');
    expect(res.body.data.document.status).toBe('EXTRACTED');
    expect(res.body.data.itemsCount).toBeGreaterThanOrEqual(1);

    uploadedDocId = res.body.data.document.id;

    // Check that extracted items exist in DB as DRAFT
    const items = await prisma.knowledgeItem.findMany({
      where: { documentId: uploadedDocId },
    });
    expect(items.length).toBeGreaterThanOrEqual(1);
    for (const item of items) {
      expect(item.status).toBe('DRAFT'); // Zero silent auto-approval
    }
  });

  it('POST /api/brand-documents as CREATOR is rejected with 403 FORBIDDEN', async () => {
    const buffer = Buffer.from('Some rules', 'utf-8');
    const res = await request(app)
      .post('/api/brand-documents')
      .set('Authorization', `Bearer ${creatorToken}`)
      .attach('file', buffer, 'test-guidelines-creator.txt');

    expect(res.status).toBe(403);
  });

  it('POST /api/brand-documents without file returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/brand-documents')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/brand-documents returns workspace document list', async () => {
    const res = await request(app)
      .get('/api/brand-documents')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.documents.length).toBeGreaterThanOrEqual(1);

    const doc = res.body.data.documents.find((d) => d.id === uploadedDocId);
    expect(doc).toBeDefined();
    expect(doc._count.knowledgeItems).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/brand-documents/:id returns document details', async () => {
    const res = await request(app)
      .get(`/api/brand-documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(uploadedDocId);
    expect(res.body.data.fileName).toBe('test-guidelines.txt');
  });

  it('DELETE /api/brand-documents/:id as ADMIN deletes document', async () => {
    const res = await request(app)
      .delete(`/api/brand-documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Document deleted successfully');

    // Verify it is gone from DB
    const check = await prisma.brandDocument.findUnique({ where: { id: uploadedDocId } });
    expect(check).toBeNull();
  });
});
