import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Demo Login Endpoints (Judge 1-Click Access)', () => {
  it('POST /api/auth/demo-login enables 1-click access as ADMIN', async () => {
    const res = await request(app)
      .post('/api/auth/demo-login')
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('admin.demo@brandcheck.io');
    expect(res.body.workspace.role).toBe('ADMIN');
    expect(res.body.workspace.name).toBe('Acme Brand (Demo Workspace)');
    expect(res.body.accessToken).toBeDefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('refreshToken='))).toBe(true);
  });

  it('POST /api/auth/demo-login enables 1-click access as CREATOR', async () => {
    const res = await request(app)
      .post('/api/auth/demo-login')
      .send({ role: 'CREATOR' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('creator.demo@brandcheck.io');
    expect(res.body.workspace.role).toBe('CREATOR');
    expect(res.body.workspace.name).toBe('Acme Brand (Demo Workspace)');
    expect(res.body.accessToken).toBeDefined();
  });

  it('POST /api/auth/demo-login enables 1-click access as REVIEWER', async () => {
    const res = await request(app)
      .post('/api/auth/demo-login')
      .send({ role: 'REVIEWER' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('reviewer.demo@brandcheck.io');
    expect(res.body.workspace.role).toBe('REVIEWER');
    expect(res.body.workspace.name).toBe('Acme Brand (Demo Workspace)');
    expect(res.body.accessToken).toBeDefined();
  });

  it('POST /api/auth/demo-login rejects invalid role with 400', async () => {
    const res = await request(app)
      .post('/api/auth/demo-login')
      .send({ role: 'SUPERUSER_INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
