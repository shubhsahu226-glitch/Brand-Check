import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import prisma from '../src/lib/prisma';
import { generateAccessToken, getJwtSecret } from '../src/lib/tokens';
import { requireAuth, requireRole, scoped } from '../src/middleware/auth';

describe('Step 4: Auth Middleware and Tenant Scoping', () => {
  let testApp;
  let adminUser;
  let creatorUser;
  let orphanUser;
  let workspaceA;
  let workspaceB;
  let adminToken;
  let creatorToken;
  let orphanToken;

  beforeAll(async () => {
    // Clean up any residual test records first
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'authtest-' } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { contains: 'authtest-' } } },
    });
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'authtest-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'authtest-' } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'AuthTest-WS-' } },
    });

    // Create Admin User & Workspace A
    adminUser = await prisma.user.create({
      data: {
        email: `authtest-admin-${Date.now()}@brandcheck.io`,
        name: 'Admin Test User',
        passwordHash: '$2a$12$fakehashedpasswordforadmintesting1234567890',
      },
    });

    workspaceA = await prisma.workspace.create({
      data: {
        name: `AuthTest-WS-A-${Date.now()}`,
        createdById: adminUser.id,
      },
    });

    await prisma.membership.create({
      data: {
        userId: adminUser.id,
        workspaceId: workspaceA.id,
        role: 'ADMIN',
      },
    });

    // Create Creator User in Workspace A
    creatorUser = await prisma.user.create({
      data: {
        email: `authtest-creator-${Date.now()}@brandcheck.io`,
        name: 'Creator Test User',
        passwordHash: '$2a$12$fakehashedpasswordforcreatortesting12345',
      },
    });

    await prisma.membership.create({
      data: {
        userId: creatorUser.id,
        workspaceId: workspaceA.id,
        role: 'CREATOR',
      },
    });

    // Create Workspace B (owned by adminUser, creatorUser is NOT a member)
    workspaceB = await prisma.workspace.create({
      data: {
        name: `AuthTest-WS-B-${Date.now()}`,
        createdById: adminUser.id,
      },
    });

    // Create Orphan User (has no memberships)
    orphanUser = await prisma.user.create({
      data: {
        email: `authtest-orphan-${Date.now()}@brandcheck.io`,
        name: 'Orphan Test User',
        passwordHash: '$2a$12$fakehashedpasswordfororphantesting12345',
      },
    });

    adminToken = generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
    });
    creatorToken = generateAccessToken({
      userId: creatorUser.id,
      email: creatorUser.email,
    });
    orphanToken = generateAccessToken({
      userId: orphanUser.id,
      email: orphanUser.email,
    });

    // Build dedicated test express app
    testApp = express();
    testApp.use(express.json());

    // Test endpoint requiring authentication
    testApp.get('/test/auth', requireAuth, (req, res) => {
      const scope = scoped(req);
      res.json({
        ok: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          hasPassword: 'passwordHash' in req.user,
        },
        membership: {
          workspaceId: req.currentMembership.workspaceId,
          role: req.currentMembership.role,
        },
        scoped: scope,
      });
    });

    // Test endpoint requiring ADMIN role
    testApp.post('/test/admin-only', requireAuth, requireRole('ADMIN'), (req, res) => {
      const scope = scoped(req);
      res.json({ ok: true, scope });
    });

    // Test endpoint requiring CREATOR or REVIEWER role
    testApp.get(
      '/test/creator-or-reviewer',
      requireAuth,
      requireRole('CREATOR', 'REVIEWER'),
      (req, res) => {
        const scope = scoped(req);
        res.json({ ok: true, scope });
      }
    );
  });

  afterAll(async () => {
    // Clean up all test records
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'authtest-' } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { contains: 'authtest-' } } },
    });
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'authtest-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'authtest-' } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'AuthTest-WS-' } },
    });
  });

  describe('requireAuth Middleware', () => {
    it('returns 401 UNAUTHENTICATED when Authorization header is missing', async () => {
      const res = await request(testApp).get('/test/auth');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Missing or malformed authorization token',
        },
      });
    });

    it('returns 401 UNAUTHENTICATED when Authorization header format is invalid', async () => {
      const res = await request(testApp)
        .get('/test/auth')
        .set('Authorization', 'Basic 123456');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 401 UNAUTHENTICATED when token signature is invalid or tampered', async () => {
      const tampered = adminToken.slice(0, -6) + 'abcdef';
      const res = await request(testApp)
        .get('/test/auth')
        .set('Authorization', `Bearer ${tampered}`);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid access token',
        },
      });
    });

    it('returns 401 UNAUTHENTICATED when token is expired', async () => {
      const secret = getJwtSecret();
      const expiredToken = jwt.sign(
        { userId: adminUser.id, email: adminUser.email },
        secret,
        { expiresIn: '-1s' }
      );

      const res = await request(testApp)
        .get('/test/auth')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Access token expired',
        },
      });
    });

    it('returns 401 UNAUTHENTICATED when user does not exist in DB despite valid JWT', async () => {
      const ghostToken = generateAccessToken({
        userId: 'non-existent-user-cuid-999',
        email: 'ghost@brandcheck.io',
      });

      const res = await request(testApp)
        .get('/test/auth')
        .set('Authorization', `Bearer ${ghostToken}`);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User no longer exists',
        },
      });
    });

    it('returns 403 FORBIDDEN when user has no active memberships', async () => {
      const res = await request(testApp)
        .get('/test/auth')
        .set('Authorization', `Bearer ${orphanToken}`);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'User has no active workspace memberships',
        },
      });
    });

    it('authenticates valid user, attaches sanitized user and currentMembership', async () => {
      const res = await request(testApp)
        .get('/test/auth')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.user.id).toBe(adminUser.id);
      expect(res.body.user.email).toBe(adminUser.email);
      expect(res.body.user.hasPassword).toBe(false); // passwordHash never exposed
      expect(res.body.membership.workspaceId).toBe(workspaceA.id);
      expect(res.body.membership.role).toBe('ADMIN');
      expect(res.body.scoped).toEqual({
        userId: adminUser.id,
        workspaceId: workspaceA.id,
        role: 'ADMIN',
      });
    });
  });

  describe('Tenant Scoping & Parameter Smuggling Protection', () => {
    it('scoped(req) completely ignores workspaceId smuggled in request body', async () => {
      const fakeWorkspaceId = 'malicious-workspace-id-99999';

      const res = await request(testApp)
        .post('/test/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          workspaceId: fakeWorkspaceId,
          role: 'ADMIN',
        });

      expect(res.status).toBe(200);
      expect(res.body.scope.workspaceId).toBe(workspaceA.id);
      expect(res.body.scope.workspaceId).not.toBe(fakeWorkspaceId);
    });

    it('falls back safely to valid membership when malicious x-workspace-id header is sent', async () => {
      // creatorUser belongs to workspaceA only, not workspaceB
      const res = await request(testApp)
        .get('/test/auth')
        .set('Authorization', `Bearer ${creatorToken}`)
        .set('x-workspace-id', workspaceB.id);

      expect(res.status).toBe(200);
      // Middleware refuses to select workspaceB because creatorUser has no membership in workspaceB
      expect(res.body.membership.workspaceId).toBe(workspaceA.id);
      expect(res.body.scoped.workspaceId).toBe(workspaceA.id);
    });

    it('throws Error if scoped(req) is invoked without requireAuth middleware', () => {
      const bareReq = { user: null, currentMembership: null };
      expect(() => scoped(bareReq)).toThrow(
        'scoped(req) called without requireAuth middleware'
      );
    });
  });

  describe('requireRole Middleware', () => {
    it('allows ADMIN to access requireRole("ADMIN")', async () => {
      const res = await request(testApp)
        .post('/test/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('denies CREATOR accessing requireRole("ADMIN") with 403 FORBIDDEN', async () => {
      const res = await request(testApp)
        .post('/test/admin-only')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'Action requires one of the following roles: ADMIN',
        },
      });
    });

    it('allows CREATOR accessing requireRole("CREATOR", "REVIEWER")', async () => {
      const res = await request(testApp)
        .get('/test/creator-or-reviewer')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('denies ADMIN accessing requireRole("CREATOR", "REVIEWER") with 403 FORBIDDEN', async () => {
      const res = await request(testApp)
        .get('/test/creator-or-reviewer')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'Action requires one of the following roles: CREATOR, REVIEWER',
        },
      });
    });
  });
});
