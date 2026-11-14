import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app.js';

const prisma = new PrismaClient();
let app: FastifyInstance;

const P1 = '+249990000001';
const P2 = '+249990000002';
const PASSWORD = 'Password123!';

async function cleanup() {
  await prisma.user.deleteMany({ where: { phone: { in: [P1, P2] } } });
}

beforeAll(async () => {
  await cleanup();
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await cleanup();
  await app.close();
  await prisma.$disconnect();
});

describe('auth', () => {
  it('registers a customer with role CUSTOMER only', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { phone: P1, fullName: 'Test One', password: PASSWORD },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { token: string; user: { role: string } };
    expect(body.token).toBeTruthy();
    expect(body.user.role).toBe('CUSTOMER');
  });

  it('rejects unknown field (role escalation) with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { phone: P2, fullName: 'Sneaky', password: PASSWORD, role: 'ADMIN' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects duplicate phone with generic 409', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { phone: P1, fullName: 'Dup', password: PASSWORD },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: 'conflict' });
  });

  it('logs in with correct credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { phone: P1, password: PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { token: string };
    expect(body.token).toBeTruthy();
  });

  it('returns generic error on wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { phone: P1, password: 'WrongPass!' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: 'invalid_credentials' });
  });

  it('rejects /api/auth/me without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
  });

  it('returns current user with valid token', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { phone: P1, password: PASSWORD },
    });
    const { token } = login.json() as { token: string };
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { user: { phone: string; role: string } };
    expect(body.user.phone).toBe(P1);
    expect(body.user.role).toBe('CUSTOMER');
  });
});
