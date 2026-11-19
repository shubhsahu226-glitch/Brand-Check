import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import { hashToken } from '../src/lib/tokens';

describe('Step 7: Master Auth & Workspaces Integration Test Suite (7 Mandatory Acceptance Criteria)', () => {
  const runId = Date.now();
  let adminAUser, adminAToken, workspaceA, refreshCookieA;
  let _adminBUser, adminBToken, workspaceB;
  let creatorAUser, creatorAToken;

  const adminACreds = {
    name: 'Admin Alpha',
    email: `master-admin-a-${runId}@brandcheck.io`,
    password: 'MasterPassword123!',
    workspaceName: `Master-WS-A-${runId}`,
  };

  const adminBCreds = {
    name: 'Admin Beta',
    email: `master-admin-b-${runId}@brandcheck.io`,
    password: 'MasterPassword123!',
    workspaceName: `Master-WS-B-${runId}`,
  };

  beforeAll(async () => {
    // Initial cleanup of any records matching test prefix
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'master-' } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { contains: 'master-' } } },
    });
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'master-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'master-' } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'Master-WS-' } },
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'master-' } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { contains: 'master-' } } },
    });
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'master-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'master-' } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'Master-WS-' } },
    });
  });

  /**
   * CRITERION 1:
   * Signup creates user, workspace, and ADMIN membership in one transaction with refresh cookie.
   */
  it('Criterion 1: Signup creates User, Workspace, and ADMIN Membership in one atomic transaction with refresh cookie', async () => {
    const res = await request(app).post('/api/auth/signup').send(adminACreds);

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(adminACreds.email.toLowerCase());
    expect(res.body.user.name).toBe(adminACreds.name);
    expect(res.body.user.passwordHash).toBeUndefined(); // Never leaked

    expect(res.body.workspace).toBeDefined();
    expect(res.body.workspace.name).toBe(adminACreds.workspaceName);
    expect(res.body.workspace.role).toBe('ADMIN');

    expect(typeof res.body.accessToken).toBe('string');
    adminAToken = res.body.accessToken;
    adminAUser = res.body.user;
    workspaceA = res.body.workspace;

    // Verify Set-Cookie header
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieHeader = cookies.find((c) => c.startsWith('refreshToken='));
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain('Path=/api/auth');
    expect(cookieHeader).toContain('HttpOnly');
    refreshCookieA = cookieHeader.split(';')[0];

    // Verify database state: User, Workspace, Membership (role ADMIN), RefreshToken row
    const dbUser = await prisma.user.findUnique({
      where: { id: adminAUser.id },
      include: {
        memberships: { include: { workspace: true } },
        refreshTokens: true,
      },
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser.memberships).toHaveLength(1);
    expect(dbUser.memberships[0].role).toBe('ADMIN');
    expect(dbUser.memberships[0].workspace.createdById).toBe(adminAUser.id);
    expect(dbUser.refreshTokens).toHaveLength(1);

    // Verify bcrypt cost 12
    expect(
      dbUser.passwordHash.startsWith('$2a$12$') ||
        dbUser.passwordHash.startsWith('$2b$12$')
    ).toBe(true);

    // Also sign up Workspace B for multi-tenant tests
    const resB = await request(app).post('/api/auth/signup').send(adminBCreds);
    expect(resB.status).toBe(201);
    _adminBUser = resB.body.user;
    adminBToken = resB.body.accessToken;
    workspaceB = resB.body.workspace;
  });

  /**
   * CRITERION 2:
   * Login authenticates valid credentials, returns access token, sets refresh cookie.
   * Invalid email or wrong password returns generic 401 UNAUTHENTICATED error.
   */
  it('Criterion 2: Login authenticates valid credentials and returns generic error on failure', async () => {
    // Successful login
    const loginRes = await request(app).post('/api/auth/login').send({
      email: adminACreds.email,
      password: adminACreds.password,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.id).toBe(adminAUser.id);
    expect(loginRes.body.workspace.id).toBe(workspaceA.id);
    expect(loginRes.body.workspace.role).toBe('ADMIN');
    expect(typeof loginRes.body.accessToken).toBe('string');

    const cookies = loginRes.headers['set-cookie'];
    const cookieHeader = cookies.find((c) => c.startsWith('refreshToken='));
    expect(cookieHeader).toBeDefined();
    refreshCookieA = cookieHeader.split(';')[0];

    // Failed login - wrong password
    const wrongPassRes = await request(app).post('/api/auth/login').send({
      email: adminACreds.email,
      password: 'CompletelyWrongPassword!',
    });
    expect(wrongPassRes.status).toBe(401);
    expect(wrongPassRes.body).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Invalid email or password',
      },
    });

    // Failed login - non-existent email (exact same generic message)
    const wrongEmailRes = await request(app).post('/api/auth/login').send({
      email: 'nonexistent-user-xyz@brandcheck.io',
      password: adminACreds.password,
    });
    expect(wrongEmailRes.status).toBe(401);
    expect(wrongEmailRes.body).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Invalid email or password',
      },
    });
  });

  /**
   * CRITERION 3:
   * Refresh token rotation & reuse detection:
   * Normal refresh rotates cookie and issues new access token.
   * Reuse of old token revokes all active tokens for that user.
   */
  it('Criterion 3: Refresh token rotation on use and reuse detection revokes all user sessions', async () => {
    // 1. Valid refresh
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshCookieA]);

    expect(refreshRes.status).toBe(200);
    expect(typeof refreshRes.body.accessToken).toBe('string');

    const newCookies = refreshRes.headers['set-cookie'];
    const newCookieHeader = newCookies.find((c) =>
      c.startsWith('refreshToken=')
    );
    expect(newCookieHeader).toBeDefined();

    const oldCookieUsed = refreshCookieA;
    const newRotatedCookie = newCookieHeader.split(';')[0];
    expect(newRotatedCookie).not.toBe(oldCookieUsed);

    // 2. Attempt to REUSE old cookie (Replay Attack)
    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [oldCookieUsed]);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe('UNAUTHENTICATED');
    expect(reuseRes.body.error.message).toContain('reuse detected');

    // 3. Verify ALL active tokens for user are now revoked in DB
    const activeTokens = await prisma.refreshToken.findMany({
      where: { userId: adminAUser.id, revokedAt: null },
    });
    expect(activeTokens).toHaveLength(0);

    // 4. Therefore, the previously issued newRotatedCookie must now also fail
    const subsequentRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [newRotatedCookie]);
    expect(subsequentRes.status).toBe(401);

    // Re-login Admin A to restore working session
    const relogin = await request(app).post('/api/auth/login').send({
      email: adminACreds.email,
      password: adminACreds.password,
    });
    adminAToken = relogin.body.accessToken;
    refreshCookieA = relogin.headers['set-cookie']
      .find((c) => c.startsWith('refreshToken='))
      .split(';')[0];
  });

  /**
   * CRITERION 4:
   * Creator role denied 403 FORBIDDEN on POST /api/invitations.
   */
  it('Criterion 4: Creator role is denied 403 FORBIDDEN on POST /api/invitations', async () => {
    // Create and login a Creator in Workspace A
    const creatorEmail = `master-creator-a-${runId}@brandcheck.io`;
    creatorAUser = await prisma.user.create({
      data: {
        name: 'Creator A',
        email: creatorEmail,
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

    const loginCreator = await request(app).post('/api/auth/login').send({
      email: creatorEmail,
      password: 'CreatorPass123!',
    });
    creatorAToken = loginCreator.body.accessToken;

    // Creator tries to invite someone
    const inviteAttempt = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${creatorAToken}`)
      .send({
        email: `master-someone-${runId}@brandcheck.io`,
        role: 'REVIEWER',
      });

    expect(inviteAttempt.status).toBe(403);
    expect(inviteAttempt.body).toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'Action requires one of the following roles: ADMIN',
      },
    });
  });

  /**
   * CRITERION 5:
   * Expired invitation rejected with 400 VALIDATION_ERROR.
   */
  it('Criterion 5: Expired invitation is rejected with 400 VALIDATION_ERROR', async () => {
    const rawExpiredToken = 'master-expired-token-raw-' + runId;
    const tokenHash = hashToken(rawExpiredToken);

    await prisma.invitation.create({
      data: {
        workspaceId: workspaceA.id,
        email: `master-expired-${runId}@brandcheck.io`,
        role: 'CREATOR',
        tokenHash,
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
      },
    });

    const acceptRes = await request(app)
      .post('/api/invitations/accept')
      .send({
        token: rawExpiredToken,
        name: 'Expired Token User',
        password: 'Password123!',
      });

    expect(acceptRes.status).toBe(400);
    expect(acceptRes.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invitation has expired',
      },
    });
  });

  /**
   * CRITERION 6:
   * Accepted invitation cannot be reused (409 CONFLICT).
   */
  it('Criterion 6: Accepted invitation cannot be reused (409 CONFLICT)', async () => {
    const inviteEmail = `master-reuse-test-${runId}@brandcheck.io`;

    // Admin creates invite
    const inviteRes = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        email: inviteEmail,
        role: 'REVIEWER',
      });
    expect(inviteRes.status).toBe(201);
    const rawToken = new URL(inviteRes.body.inviteUrl).searchParams.get('token');

    // First acceptance (should succeed)
    const accept1 = await request(app)
      .post('/api/invitations/accept')
      .send({
        token: rawToken,
        name: 'New Reviewer',
        password: 'SecurePass123!',
      });
    expect(accept1.status).toBe(200);
    expect(accept1.body.user.email).toBe(inviteEmail);
    expect(accept1.body.workspace.role).toBe('REVIEWER');

    // Second acceptance with the exact same token (must fail with 409 CONFLICT)
    const accept2 = await request(app)
      .post('/api/invitations/accept')
      .send({
        token: rawToken,
        name: 'Attacker Replay',
        password: 'SecurePass123!',
      });
    expect(accept2.status).toBe(409);
    expect(accept2.body).toEqual({
      error: {
        code: 'CONFLICT',
        message: 'Invitation has already been accepted',
      },
    });
  });

  /**
   * CRITERION 7:
   * Multi-tenant isolation: Admin A cannot view or touch Workspace B members/invitations.
   * Parameter smuggling in body or headers is ignored by scoped(req).
   */
  it('Criterion 7: Multi-tenant isolation guarantees Admin A cannot see or manipulate Workspace B data', async () => {
    // 1. Admin B creates invite in Workspace B
    const inviteBRes = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${adminBToken}`)
      .send({
        email: `master-target-b-${runId}@brandcheck.io`,
        role: 'REVIEWER',
      });
    expect(inviteBRes.status).toBe(201);

    // 2. Admin A requests invitations -> must NOT see Workspace B invite
    const adminAInvites = await request(app)
      .get('/api/invitations')
      .set('Authorization', `Bearer ${adminAToken}`);
    expect(adminAInvites.status).toBe(200);

    const hasBInvite = adminAInvites.body.some(
      (inv) => inv.email === `master-target-b-${runId}@brandcheck.io`
    );
    expect(hasBInvite).toBe(false);

    // 3. Admin A requests members -> must NOT see Admin B
    const adminAMembers = await request(app)
      .get('/api/members')
      .set('Authorization', `Bearer ${adminAToken}`);
    expect(adminAMembers.status).toBe(200);

    const hasAdminB = adminAMembers.body.some(
      (m) => m.user.email === adminBCreds.email
    );
    expect(hasAdminB).toBe(false);

    // 4. Parameter smuggling attack: Admin A supplies Workspace B's ID in body to /api/invitations
    const smuggleRes = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        email: `master-smuggle-${runId}@brandcheck.io`,
        role: 'CREATOR',
        workspaceId: workspaceB.id, // Malicious attempt to inject into Workspace B
      });
    expect(smuggleRes.status).toBe(201);

    // Verify in DB that invitation was created in Workspace A (caller's verified tenant), NOT Workspace B
    const dbSmuggleInvite = await prisma.invitation.findFirst({
      where: { email: `master-smuggle-${runId}@brandcheck.io` },
    });
    expect(dbSmuggleInvite.workspaceId).toBe(workspaceA.id);
    expect(dbSmuggleInvite.workspaceId).not.toBe(workspaceB.id);
  });
});
