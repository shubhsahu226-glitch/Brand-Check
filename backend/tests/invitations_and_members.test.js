import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import { hashToken } from '../src/lib/tokens';

describe('Step 6: Invitations and Members Endpoints', () => {
  const uniqueId = Date.now();
  let adminAUser, adminAToken, workspaceA;
  let creatorAUser, creatorAToken;
  let adminBUser, adminBToken, workspaceB;

  beforeAll(async () => {
    // Clean up any lingering records
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'step6-' } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { contains: 'step6-' } } },
    });
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'step6-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'step6-' } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'Step6-WS-' } },
    });

    // Create Admin A & Workspace A via signup endpoint
    const signupARes = await request(app).post('/api/auth/signup').send({
      name: 'Admin A User',
      email: `step6-admin-a-${uniqueId}@brandcheck.io`,
      password: 'AdminPassword123!',
      workspaceName: `Step6-WS-A-${uniqueId}`,
    });
    expect(signupARes.status).toBe(201);
    adminAUser = signupARes.body.user;
    adminAToken = signupARes.body.accessToken;
    workspaceA = signupARes.body.workspace;

    // Create Admin B & Workspace B via signup endpoint (for multi-tenant checks)
    const signupBRes = await request(app).post('/api/auth/signup').send({
      name: 'Admin B User',
      email: `step6-admin-b-${uniqueId}@brandcheck.io`,
      password: 'AdminPassword123!',
      workspaceName: `Step6-WS-B-${uniqueId}`,
    });
    expect(signupBRes.status).toBe(201);
    adminBUser = signupBRes.body.user;
    adminBToken = signupBRes.body.accessToken;
    workspaceB = signupBRes.body.workspace;

    // Create a Creator user in Workspace A
    creatorAUser = await prisma.user.create({
      data: {
        name: 'Creator A User',
        email: `step6-creator-a-${uniqueId}@brandcheck.io`,
        passwordHash: await bcrypt.hash('CreatorPass123!', 12),
      },
    });
    await prisma.membership.create({
      data: {
        userId: creatorAUser.id,
        workspaceId: workspaceA.id,
        role: 'CREATOR',
      },
    });

    // Login Creator A to get access token
    const loginCreatorRes = await request(app).post('/api/auth/login').send({
      email: creatorAUser.email,
      password: 'CreatorPass123!',
    });
    creatorAToken = loginCreatorRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'step6-' } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { contains: 'step6-' } } },
    });
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'step6-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'step6-' } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'Step6-WS-' } },
    });
  });

  describe('POST /api/invitations', () => {
    it('Admin can create invitation for CREATOR role, returning inviteUrl without leaking tokenHash', async () => {
      const inviteEmail = `step6-invited-creator-${uniqueId}@brandcheck.io`;
      const res = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          email: inviteEmail,
          role: 'CREATOR',
        });

      expect(res.status).toBe(201);
      expect(res.body.invitation).toBeDefined();
      expect(res.body.invitation.email).toBe(inviteEmail);
      expect(res.body.invitation.role).toBe('CREATOR');
      expect(res.body.invitation.tokenHash).toBeUndefined(); // Never expose tokenHash
      expect(res.body.inviteUrl).toBeDefined();
      expect(res.body.inviteUrl).toContain('token=');

      // Verify token in DB is hashed
      const rawToken = new URL(res.body.inviteUrl).searchParams.get('token');
      expect(rawToken).toBeDefined();
      const dbInvite = await prisma.invitation.findUnique({
        where: { tokenHash: hashToken(rawToken) },
      });
      expect(dbInvite).not.toBeNull();
      expect(dbInvite.email).toBe(inviteEmail);
      expect(dbInvite.workspaceId).toBe(workspaceA.id);
    });

    it('CREATOR role is denied 403 FORBIDDEN when attempting to create invitation', async () => {
      const res = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${creatorAToken}`)
        .send({
          email: `step6-unauthorized-${uniqueId}@brandcheck.io`,
          role: 'REVIEWER',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects invitation creation if email is already a member with 409 CONFLICT', async () => {
      const res = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          email: creatorAUser.email,
          role: 'CREATOR',
        });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        error: {
          code: 'CONFLICT',
          message: 'User is already a member of this workspace',
        },
      });
    });

    it('replaces previous pending invitation if re-invited', async () => {
      const targetEmail = `step6-reinvite-${uniqueId}@brandcheck.io`;

      const res1 = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ email: targetEmail, role: 'CREATOR' });
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ email: targetEmail, role: 'REVIEWER' });
      expect(res2.status).toBe(201);

      // Verify only 1 pending invitation exists for targetEmail in workspaceA
      const activeInvites = await prisma.invitation.findMany({
        where: { email: targetEmail, workspaceId: workspaceA.id, acceptedAt: null },
      });
      expect(activeInvites).toHaveLength(1);
      expect(activeInvites[0].role).toBe('REVIEWER');
    });
  });

  describe('GET /api/invitations & Multi-Tenant Isolation', () => {
    it('Admin A sees only pending invitations for Workspace A, not Workspace B', async () => {
      // Create invite in Workspace B
      const resB = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({
          email: `step6-ws-b-invite-${uniqueId}@brandcheck.io`,
          role: 'REVIEWER',
        });
      expect(resB.status).toBe(201);

      // Admin A queries invitations
      const resA = await request(app)
        .get('/api/invitations')
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(resA.status).toBe(200);
      expect(Array.isArray(resA.body)).toBe(true);

      // Verify no invitations from Workspace B appear in Workspace A's list
      const hasWorkspaceBInvite = resA.body.some(
        (inv) => inv.email === `step6-ws-b-invite-${uniqueId}@brandcheck.io`
      );
      expect(hasWorkspaceBInvite).toBe(false);

      // Verify tokenHash is never exposed in list items
      for (const inv of resA.body) {
        expect(inv.tokenHash).toBeUndefined();
      }
    });

    it('Non-admin is denied 403 on GET /api/invitations', async () => {
      const res = await request(app)
        .get('/api/invitations')
        .set('Authorization', `Bearer ${creatorAToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/invitations/accept (Public endpoint)', () => {
    it('new user accepts invite, creates account, joins workspace, sets cookie and accessToken', async () => {
      const inviteEmail = `step6-accept-new-${uniqueId}@brandcheck.io`;
      const inviteRes = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          email: inviteEmail,
          role: 'REVIEWER',
        });
      expect(inviteRes.status).toBe(201);
      const rawToken = new URL(inviteRes.body.inviteUrl).searchParams.get('token');

      // Public inspection endpoint test
      const inspectRes = await request(app).get(`/api/invitations/${rawToken}`);
      expect(inspectRes.status).toBe(200);
      expect(inspectRes.body.email).toBe(inviteEmail);
      expect(inspectRes.body.role).toBe('REVIEWER');
      expect(inspectRes.body.workspace.id).toBe(workspaceA.id);

      // Accept invitation without Authorization header (public)
      const acceptRes = await request(app)
        .post('/api/invitations/accept')
        .send({
          token: rawToken,
          name: 'Newly Invited Reviewer',
          password: 'SecurePassword123!',
        });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.user.email).toBe(inviteEmail);
      expect(acceptRes.body.user.name).toBe('Newly Invited Reviewer');
      expect(acceptRes.body.workspace.id).toBe(workspaceA.id);
      expect(acceptRes.body.workspace.role).toBe('REVIEWER');
      expect(typeof acceptRes.body.accessToken).toBe('string');

      // Check refresh cookie
      const cookies = acceptRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookieHeader = cookies.find((c) =>
        c.startsWith('refreshToken=')
      );
      expect(refreshCookieHeader).toBeDefined();
      expect(refreshCookieHeader).toContain('Path=/api/auth');

      // Verify in DB that invitation is marked accepted
      const tokenHash = hashToken(rawToken);
      const dbInvite = await prisma.invitation.findUnique({
        where: { tokenHash },
      });
      expect(dbInvite.acceptedAt).not.toBeNull();

      // Verify membership exists
      const dbMembership = await prisma.membership.findFirst({
        where: {
          user: { email: inviteEmail },
          workspaceId: workspaceA.id,
        },
      });
      expect(dbMembership).not.toBeNull();
      expect(dbMembership.role).toBe('REVIEWER');

      // Check password hashed with bcrypt cost 12
      const dbUser = await prisma.user.findUnique({
        where: { email: inviteEmail },
      });
      expect(dbUser.passwordHash.startsWith('$2a$12$') || dbUser.passwordHash.startsWith('$2b$12$')).toBe(true);
    });

    it('rejects reuse of accepted invitation with 409 CONFLICT', async () => {
      const inviteEmail = `step6-accept-reuse-${uniqueId}@brandcheck.io`;
      const inviteRes = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          email: inviteEmail,
          role: 'CREATOR',
        });
      const rawToken = new URL(inviteRes.body.inviteUrl).searchParams.get('token');

      // First accept succeeds
      const firstRes = await request(app)
        .post('/api/invitations/accept')
        .send({
          token: rawToken,
          name: 'First User',
          password: 'Password123!',
        });
      expect(firstRes.status).toBe(200);

      // Second accept with same token must fail
      const secondRes = await request(app)
        .post('/api/invitations/accept')
        .send({
          token: rawToken,
          name: 'Replay Attempt',
          password: 'Password123!',
        });
      expect(secondRes.status).toBe(409);
      expect(secondRes.body).toEqual({
        error: {
          code: 'CONFLICT',
          message: 'Invitation has already been accepted',
        },
      });
    });

    it('rejects expired invitation with 400 VALIDATION_ERROR', async () => {
      const rawToken = 'expired-token-raw-test-' + uniqueId;
      const tokenHash = hashToken(rawToken);

      await prisma.invitation.create({
        data: {
          workspaceId: workspaceA.id,
          email: `step6-expired-${uniqueId}@brandcheck.io`,
          role: 'CREATOR',
          tokenHash,
          expiresAt: new Date(Date.now() - 10000), // Expired in past
        },
      });

      const res = await request(app)
        .post('/api/invitations/accept')
        .send({
          token: rawToken,
          name: 'Expired Test',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invitation has expired',
        },
      });
    });

    it('rejects non-existent token with 404 NOT_FOUND', async () => {
      const res = await request(app)
        .post('/api/invitations/accept')
        .send({
          token: 'non-existent-token-xyz-12345',
          name: 'Ghost User',
          password: 'Password123!',
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Invitation not found or invalid',
        },
      });
    });

    it('existing user accepts invitation to another workspace with correct password', async () => {
      // Invite adminAUser (who already exists) to workspaceB
      const inviteRes = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({
          email: adminAUser.email,
          role: 'REVIEWER',
        });
      expect(inviteRes.status).toBe(201);
      const rawToken = new URL(inviteRes.body.inviteUrl).searchParams.get('token');

      // Wrong password attempt
      const wrongPassRes = await request(app)
        .post('/api/invitations/accept')
        .send({
          token: rawToken,
          name: 'Any Name',
          password: 'WrongPassword999!',
        });
      expect(wrongPassRes.status).toBe(401);
      expect(wrongPassRes.body.error.code).toBe('UNAUTHENTICATED');

      // Correct password attempt
      const correctRes = await request(app)
        .post('/api/invitations/accept')
        .send({
          token: rawToken,
          name: 'Admin A Name Should Not Change',
          password: 'AdminPassword123!',
        });
      expect(correctRes.status).toBe(200);
      expect(correctRes.body.user.email).toBe(adminAUser.email);
      expect(correctRes.body.workspace.id).toBe(workspaceB.id);
      expect(correctRes.body.workspace.role).toBe('REVIEWER');

      // Verify user's original name was preserved in DB
      const dbUser = await prisma.user.findUnique({
        where: { id: adminAUser.id },
      });
      expect(dbUser.name).toBe('Admin A User');
    });
  });

  describe('GET /api/members', () => {
    it('Admin A retrieves members of Workspace A with user details', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // Admin A + Creator A

      // Check structure
      const member = res.body.find((m) => m.user.email === adminAUser.email);
      expect(member).toBeDefined();
      expect(member.role).toBe('ADMIN');
      expect(member.user.name).toBe(adminAUser.name);
      expect(member.user.passwordHash).toBeUndefined();
    });

    it('Multi-tenant check: Admin A cannot see members of Workspace B', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${adminAToken}`);

      const hasAdminB = res.body.some(
        (m) => m.user.email === adminBUser.email
      );
      // Admin B is in Workspace B only
      expect(hasAdminB).toBe(false);
    });

    it('Non-admin caller is denied 403 on GET /api/members', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${creatorAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
