import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import { hashToken } from '../src/lib/tokens';

describe('Step 5: Auth Endpoints', () => {
  const uniqueId = Date.now();
  const testUser = {
    name: 'Alice Tester',
    email: `alice.endpoint.${uniqueId}@brandcheck.io`,
    password: 'SuperSecurePassword123!',
    workspaceName: 'Alice Brand Lab',
  };

  let createdUser;
  let authCookie;

  beforeAll(async () => {
    // Clean up any lingering test users with this prefix
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'alice.endpoint.' } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { contains: 'alice.endpoint.' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'alice.endpoint.' } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'Alice Brand Lab' } },
    });
  });

  afterAll(async () => {
    await prisma.membership.deleteMany({
      where: { user: { email: { contains: 'alice.endpoint.' } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { contains: 'alice.endpoint.' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'alice.endpoint.' } },
    });
    await prisma.workspace.deleteMany({
      where: { name: { contains: 'Alice Brand Lab' } },
    });
  });

  describe('POST /api/auth/signup', () => {
    it('creates user, workspace, and ADMIN membership in one transaction with refresh cookie', async () => {
      const res = await request(app).post('/api/auth/signup').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user.passwordHash).toBeUndefined();

      expect(res.body.workspace).toBeDefined();
      expect(res.body.workspace.name).toBe(testUser.workspaceName);
      expect(res.body.workspace.role).toBe('ADMIN');

      expect(typeof res.body.accessToken).toBe('string');

      // Check Set-Cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookieHeader = cookies.find((c) =>
        c.startsWith('refreshToken=')
      );
      expect(refreshCookieHeader).toBeDefined();
      expect(refreshCookieHeader).toContain('Path=/api/auth');
      expect(refreshCookieHeader).toContain('HttpOnly');

      authCookie = refreshCookieHeader.split(';')[0];
      createdUser = res.body.user;

      // Verify in DB
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          memberships: {
            include: { workspace: true },
          },
          refreshTokens: true,
        },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser.memberships).toHaveLength(1);
      expect(dbUser.memberships[0].role).toBe('ADMIN');
      expect(dbUser.memberships[0].workspace.createdById).toBe(dbUser.id);
      expect(dbUser.refreshTokens).toHaveLength(1);

      // Verify bcrypt cost 12
      const isMatch = await bcrypt.compare(testUser.password, dbUser.passwordHash);
      expect(isMatch).toBe(true);
      expect(dbUser.passwordHash.startsWith('$2a$12$') || dbUser.passwordHash.startsWith('$2b$12$')).toBe(true);
    });

    it('rejects duplicate email with 409 CONFLICT', async () => {
      const res = await request(app).post('/api/auth/signup').send(testUser);

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        error: {
          code: 'CONFLICT',
          message: 'User with this email already exists',
        },
      });
    });

    it('rejects invalid payload with 400 VALIDATION_ERROR', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'A',
        email: 'invalid-email',
        password: 'short',
        workspaceName: '',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates valid credentials, returns access token, sets refresh cookie', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(createdUser.id);
      expect(res.body.workspace.name).toBe(testUser.workspaceName);
      expect(res.body.workspace.role).toBe('ADMIN');
      expect(typeof res.body.accessToken).toBe('string');

      const cookies = res.headers['set-cookie'];
      const refreshCookieHeader = cookies.find((c) =>
        c.startsWith('refreshToken=')
      );
      expect(refreshCookieHeader).toBeDefined();
      expect(refreshCookieHeader).toContain('Path=/api/auth');

      // Update authCookie with latest login cookie
      authCookie = refreshCookieHeader.split(';')[0];
    });

    it('returns 401 UNAUTHENTICATED with generic message on wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid email or password',
        },
      });
    });

    it('returns 401 UNAUTHENTICATED with same generic message on unknown email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'unknown-email-12345@brandcheck.io',
        password: 'SomePassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid email or password',
        },
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('rotates refresh token cookie and issues new access token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(typeof res.body.accessToken).toBe('string');

      const cookies = res.headers['set-cookie'];
      const refreshCookieHeader = cookies.find((c) =>
        c.startsWith('refreshToken=')
      );
      expect(refreshCookieHeader).toBeDefined();

      const newCookie = refreshCookieHeader.split(';')[0];
      expect(newCookie).not.toBe(authCookie); // Rotated to new token

      // Verify that old token in DB was marked revoked
      const oldRawToken = authCookie.split('=')[1];
      const oldHash = hashToken(oldRawToken);
      const oldDbRecord = await prisma.refreshToken.findUnique({
        where: { tokenHash: oldHash },
      });
      expect(oldDbRecord).not.toBeNull();
      expect(oldDbRecord.revokedAt).not.toBeNull();

      // Save new cookie for next test
      authCookie = newCookie;
    });

    it('detects reuse of revoked token, revokes all user tokens, and rejects with 401', async () => {
      // Find a revoked token
      const revokedRecord = await prisma.refreshToken.findFirst({
        where: { userId: createdUser.id, revokedAt: { not: null } },
      });
      expect(revokedRecord).not.toBeNull();

      // We need a raw token that produces this hash; let's simulate by creating a known raw token,
      // creating it revoked in DB, and attempting to refresh with it
      const rawReuseToken = 'simulated-reuse-raw-token-' + uniqueId;
      const reuseHash = hashToken(rawReuseToken);
      await prisma.refreshToken.create({
        data: {
          tokenHash: reuseHash,
          userId: createdUser.id,
          expiresAt: new Date(Date.now() + 1000000),
          revokedAt: new Date(), // Already revoked
        },
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${rawReuseToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
      expect(res.body.error.message).toContain('reuse detected');

      // Verify ALL active tokens for this user were revoked!
      const activeTokens = await prisma.refreshToken.findMany({
        where: { userId: createdUser.id, revokedAt: null },
      });
      expect(activeTokens).toHaveLength(0);
    });

    it('returns 401 UNAUTHENTICATED when refresh cookie is missing', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Missing refresh token',
        },
      });
    });
  });

  describe('GET /api/me and GET /api/auth/me', () => {
    it('returns 401 UNAUTHENTICATED when no token is provided', async () => {
      const res = await request(app).get('/api/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns user and workspace profile for valid access token', async () => {
      // Login again to get fresh valid access token
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      const validAccessToken = loginRes.body.accessToken;
      const latestCookie = loginRes.headers['set-cookie']
        .find((c) => c.startsWith('refreshToken='))
        .split(';')[0];

      const resDirect = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${validAccessToken}`);

      expect(resDirect.status).toBe(200);
      expect(resDirect.body).toEqual({
        user: {
          id: createdUser.id,
          email: testUser.email.toLowerCase(),
          name: testUser.name,
        },
        workspace: {
          id: expect.any(String),
          name: testUser.workspaceName,
          role: 'ADMIN',
        },
        role: 'ADMIN',
      });

      // Also check subroute /api/auth/me
      const resSub = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validAccessToken}`);
      expect(resSub.status).toBe(200);
      expect(resSub.body.user.id).toBe(createdUser.id);

      authCookie = latestCookie;
    });
  });

  describe('POST /api/auth/logout', () => {
    it('revokes refresh token in DB and clears cookie', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Logged out successfully' });

      // Check cookie was cleared
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookieHeader = cookies.find((c) =>
        c.startsWith('refreshToken=')
      );
      expect(refreshCookieHeader).toBeDefined();
      // Cleared cookie has expired or empty
      expect(
        refreshCookieHeader.includes('Expires=') ||
          refreshCookieHeader.includes('Max-Age=0') ||
          refreshCookieHeader.startsWith('refreshToken=;')
      ).toBe(true);

      // Verify refresh with that token now fails
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [authCookie]);
      expect(refreshRes.status).toBe(401);
    });
  });
});
