import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app.js';

const prisma = new PrismaClient();
let app: FastifyInstance;

const P1 = '+249990000101';
const P2 = '+249990000102';
const PASSWORD = 'Password123!';

let token1: string;
let token2: string;

async function cleanup() {
  await prisma.user.deleteMany({ where: { phone: { in: [P1, P2] } } });
}

async function register(phone: string, name: string): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { phone, fullName: name, password: PASSWORD },
  });
  return (res.json() as { token: string }).token;
}

beforeAll(async () => {
  await cleanup();
  app = await buildApp();
  await app.ready();
  token1 = await register(P1, 'User One');
  token2 = await register(P2, 'User Two');
});

afterAll(async () => {
  await cleanup();
  await app.close();
  await prisma.$disconnect();
});

describe('addresses', () => {
  let addrId: string;

  it('creates address without coordinates', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/addresses',
      headers: { authorization: `Bearer ${token1}` },
      payload: { addressText: 'Khartoum, Block 5', label: 'Home' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { address: { id: string; lat: number | null } };
    expect(body.address.id).toBeTruthy();
    expect(body.address.lat).toBeNull();
    addrId = body.address.id;
  });

  it('lists only own addresses', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/addresses',
      headers: { authorization: `Bearer ${token1}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: Array<{ addressText: string }> };
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('hides other users address (404)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/addresses/${addrId}`,
      headers: { authorization: `Bearer ${token2}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('updates own address', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/addresses/${addrId}`,
      headers: { authorization: `Bearer ${token1}` },
      payload: { notes: 'Ring the bell' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('only one address can be default', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/addresses',
      headers: { authorization: `Bearer ${token1}` },
      payload: { addressText: 'Second address', isDefault: true },
    });
    const newAddr = (create.json() as { address: { id: string } }).address;
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/addresses/${newAddr.id}`,
      headers: { authorization: `Bearer ${token1}` },
      payload: { isDefault: true },
    });
    expect(res.statusCode).toBe(200);
    const list = await app.inject({
      method: 'GET',
      url: '/api/addresses',
      headers: { authorization: `Bearer ${token1}` },
    });
    const body = list.json() as { data: Array<{ isDefault: boolean }> };
    expect(body.data.filter((a) => a.isDefault).length).toBe(1);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/addresses' });
    expect(res.statusCode).toBe(401);
  });

  it('deletes own address', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/addresses/${addrId}`,
      headers: { authorization: `Bearer ${token1}` },
    });
    expect(res.statusCode).toBe(204);
  });
});
