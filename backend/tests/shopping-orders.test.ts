import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app.js';

const prisma = new PrismaClient();
let app: FastifyInstance;

const PHONE = '+249990000301';
const OTHER = '+249990000302';
const PASSWORD = 'Password123!';
const SLUG_A = 'test-shop-a';
const SLUG_B = 'test-shop-b';

let token: string;
let otherToken: string;
let addressId: string;
let storeAId: string;
let storeBId: string;
let prodA: string;
let prodB: string;

async function cleanup() {
  await prisma.store.deleteMany({ where: { slug: { in: [SLUG_A, SLUG_B] } } });
  await prisma.user.deleteMany({ where: { phone: { in: [PHONE, OTHER] } } });
  await prisma.pricingRule.deleteMany({ where: { orderType: 'SHOPPING' } });
}

beforeAll(async () => {
  await cleanup();

  const [a, b] = await Promise.all([
    prisma.store.create({
      data: {
        slug: SLUG_A,
        nameAr: 'A',
        nameEn: 'A',
        addressText: 'K',
        lat: 15.5,
        lng: 32.5,
        isActive: true,
        isOpen: true,
        products: { create: [{ nameAr: 'pa', nameEn: 'pa', price: 100, currency: 'SDG', isAvailable: true, stock: 10 }] },
      },
      include: { products: true },
    }),
    prisma.store.create({
      data: {
        slug: SLUG_B,
        nameAr: 'B',
        nameEn: 'B',
        addressText: 'K',
        lat: 15.5,
        lng: 32.5,
        isActive: true,
        isOpen: true,
        products: { create: [{ nameAr: 'pb', nameEn: 'pb', price: 250, currency: 'SDG', isAvailable: true, stock: 3 }] },
      },
      include: { products: true },
    }),
  ]);
  storeAId = a.id;
  storeBId = b.id;
  prodA = a.products[0]!.id;
  prodB = b.products[0]!.id;

  await prisma.pricingRule.create({
    data: { orderType: 'SHOPPING', basePrice: 500, isActive: true },
  });

  app = await buildApp();
  await app.ready();

  const r = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { phone: PHONE, fullName: 'Buyer', password: PASSWORD },
  });
  token = (r.json() as { token: string }).token;
  const r2 = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { phone: OTHER, fullName: 'Other', password: PASSWORD },
  });
  otherToken = (r2.json() as { token: string }).token;

  const addr = await app.inject({
    method: 'POST',
    url: '/api/addresses',
    headers: { authorization: `Bearer ${token}` },
    payload: { addressText: 'Khartoum address' },
  });
  addressId = (addr.json() as { address: { id: string } }).address.id;
});

afterAll(async () => {
  await cleanup();
  await app.close();
  await prisma.$disconnect();
});

async function addToCart(storeId: string, productId: string, quantity: number) {
  return app.inject({
    method: 'POST',
    url: `/api/carts/${storeId}/items`,
    headers: { authorization: `Bearer ${token}` },
    payload: { productId, quantity },
  });
}

describe('shopping checkout', () => {
  let groupId: string;
  let orderIds: string[] = [];

  it('rejects checkout with empty cart', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/checkout',
      headers: { authorization: `Bearer ${token}` },
      payload: { addressId },
    });
    expect(res.statusCode).toBe(400);
  });

  it('creates multi-store checkout group with independent orders', async () => {
    await addToCart(storeAId, prodA, 2);
    await addToCart(storeBId, prodB, 1);

    const res = await app.inject({
      method: 'POST',
      url: '/api/checkout',
      headers: { authorization: `Bearer ${token}` },
      payload: { addressId },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as {
      checkoutGroup: { id: string; totalAmount: string };
      orders: Array<{ id: string; storeId: string; subtotal: string; deliveryFee: string; total: string }>;
    };
    expect(body.orders.length).toBe(2);
    expect(body.checkoutGroup.id).toBeTruthy();
    groupId = body.checkoutGroup.id;
    orderIds = body.orders.map((o) => o.id);

    const orderA = body.orders.find((o) => o.storeId === storeAId)!;
    const orderB = body.orders.find((o) => o.storeId === storeBId)!;

    // subtotal A = 2 * 100 = 200; deliveryFee = 500; total = 700
    expect(Number(orderA.subtotal)).toBe(200);
    expect(Number(orderA.deliveryFee)).toBe(500);
    expect(Number(orderA.total)).toBe(700);

    // subtotal B = 1 * 250 = 250; deliveryFee = 500; total = 750
    expect(Number(orderB.subtotal)).toBe(250);
    expect(Number(orderB.total)).toBe(750);

    expect(Number(body.checkoutGroup.totalAmount)).toBe(1450);
  });

  it('clears carts after checkout', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/carts',
      headers: { authorization: `Bearer ${token}` },
    });
    const body = res.json() as { data: unknown[] };
    expect(body.data.length).toBe(0);
  });

  it('decrements stock on purchase', async () => {
    const p = await prisma.product.findUnique({ where: { id: prodA } });
    expect(p?.stock).toBe(8);
    const q = await prisma.product.findUnique({ where: { id: prodB } });
    expect(q?.stock).toBe(2);
  });

  it('rejects checkout if stock drops below requested', async () => {
    // request more than available B stock (2)
    const r = await addToCart(storeBId, prodB, 99);
    expect(r.statusCode).toBe(400);
  });

  it('lists own orders only', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/shopping-orders',
      headers: { authorization: `Bearer ${otherToken}` },
    });
    const body = res.json() as { data: unknown[] };
    expect(body.data.length).toBe(0);
  });

  it('returns order details for owner, 404 for others', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/shopping-orders/${orderIds[0]}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);

    const res2 = await app.inject({
      method: 'GET',
      url: `/api/shopping-orders/${orderIds[0]}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res2.statusCode).toBe(404);
  });
});
