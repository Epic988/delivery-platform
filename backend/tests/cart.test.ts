import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app.js';

const prisma = new PrismaClient();
let app: FastifyInstance;

const P1 = '+249990000201';
const P2 = '+249990000202';
const PASSWORD = 'Password123!';
const STORE_SLUG = 'test-store-cart';

let token1: string;
let token2: string;
let storeId: string;
let productId: string;
let product2Id: string;

async function cleanup() {
  await prisma.store.deleteMany({ where: { slug: STORE_SLUG } });
  await prisma.user.deleteMany({ where: { phone: { in: [P1, P2] } } });
}

beforeAll(async () => {
  await cleanup();
  const store = await prisma.store.create({
    data: {
      slug: STORE_SLUG,
      nameAr: 'متجر السلة',
      nameEn: 'Cart Store',
      addressText: 'Khartoum',
      lat: 15.5,
      lng: 32.5,
      isActive: true,
      isOpen: true,
      products: {
        create: [
          { nameAr: 'P1', nameEn: 'P1', price: 100, currency: 'SDG', isAvailable: true, stock: 5 },
          { nameAr: 'P2', nameEn: 'P2', price: 200, currency: 'SDG', isAvailable: true, stock: 3 },
        ],
      },
    },
    include: { products: true },
  });
  storeId = store.id;
  productId = store.products[0]!.id;
  product2Id = store.products[1]!.id;

  app = await buildApp();
  await app.ready();

  const r1 = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { phone: P1, fullName: 'User One', password: PASSWORD },
  });
  token1 = (r1.json() as { token: string }).token;
  const r2 = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { phone: P2, fullName: 'User Two', password: PASSWORD },
  });
  token2 = (r2.json() as { token: string }).token;
});

afterAll(async () => {
  await cleanup();
  await app.close();
  await prisma.$disconnect();
});

describe('cart', () => {
  it('adds item with server-side price (client price ignored)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/carts/${storeId}/items`,
      headers: { authorization: `Bearer ${token1}` },
      payload: { productId, quantity: 2 },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { item: { unitPrice: string | number; quantity: number } };
    expect(body.item.quantity).toBe(2);
    expect(Number(body.item.unitPrice)).toBe(100);
  });

  it('lists carts for current customer only', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/carts',
      headers: { authorization: `Bearer ${token1}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: Array<{ storeId: string; items: unknown[] }> };
    expect(body.data.length).toBe(1);
    expect(body.data[0]?.items.length).toBe(1);
  });

  it('rejects quantity beyond stock', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/carts/${storeId}/items`,
      headers: { authorization: `Bearer ${token1}` },
      payload: { productId: product2Id, quantity: 99 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('updates item quantity', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/carts/${storeId}/items/${productId}`,
      headers: { authorization: `Bearer ${token1}` },
      payload: { quantity: 3 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { item: { quantity: number } };
    expect(body.item.quantity).toBe(3);
  });

  it('isolates carts between customers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/carts',
      headers: { authorization: `Bearer ${token2}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: unknown[] };
    expect(body.data.length).toBe(0);
  });

  it('deletes cart', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/carts/${storeId}`,
      headers: { authorization: `Bearer ${token1}` },
    });
    expect(res.statusCode).toBe(204);
    const list = await app.inject({
      method: 'GET',
      url: '/api/carts',
      headers: { authorization: `Bearer ${token1}` },
    });
    const body = list.json() as { data: unknown[] };
    expect(body.data.length).toBe(0);
  });
});
