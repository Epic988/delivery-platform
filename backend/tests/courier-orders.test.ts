import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app.js';

const prisma = new PrismaClient();
let app: FastifyInstance;

const PHONE = '+249990000401';
const OTHER = '+249990000402';
const PASSWORD = 'Password123!';

let token: string;
let otherToken: string;

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { phone: { in: [PHONE, OTHER] } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    await prisma.courierOrder.deleteMany({ where: { customerId: { in: ids } } });
  }
  await prisma.user.deleteMany({ where: { phone: { in: [PHONE, OTHER] } } });
  await prisma.pricingRule.deleteMany({ where: { orderType: 'COURIER' } });
}

const basePayload = {
  senderName: 'Sender',
  senderPhone: '+249912345678',
  recipientName: 'Recipient',
  recipientPhone: '+249912345679',
  packageDescription: 'Books',
  packageCategory: 'documents',
  packageSize: 'SMALL' as const,
  weightGrams: 1500,
  pickupAddressText: 'Pickup address',
  destinationAddressText: 'Destination address',
  pickupLat: 15.5,
  pickupLng: 32.5,
  destinationLat: 15.6,
  destinationLng: 32.6,
};

beforeAll(async () => {
  await cleanup();
  await prisma.pricingRule.create({
    data: {
      orderType: 'COURIER',
      basePrice: 300,
      perKmPrice: 100,
      weightSurchargePerKg: 50,
      isActive: true,
    },
  });
  app = await buildApp();
  await app.ready();

  const r = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { phone: PHONE, fullName: 'Sender', password: PASSWORD },
  });
  token = (r.json() as { token: string }).token;
  const r2 = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { phone: OTHER, fullName: 'Other', password: PASSWORD },
  });
  otherToken = (r2.json() as { token: string }).token;
});

afterAll(async () => {
  await cleanup();
  await app.close();
  await prisma.$disconnect();
});

describe('courier orders', () => {
  let orderId: string;

  it('quotes price with base + per-km + weight', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/courier-orders/quote',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        weightGrams: 1500,
        pickupLat: 15.5,
        pickupLng: 32.5,
        destLat: 15.6,
        destLng: 32.6,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { quotedPrice: string };
    expect(Number(body.quotedPrice)).toBeGreaterThan(300);
  });

  it('rejects malformed Sudanese phone', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/courier-orders',
      headers: { authorization: `Bearer ${token}` },
      payload: { ...basePayload, senderPhone: '12345' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('creates a courier order with generated order number', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/courier-orders',
      headers: { authorization: `Bearer ${token}` },
      payload: basePayload,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { order: { id: string; orderNumber: string; status: string; quotedPrice: string } };
    expect(body.order.orderNumber).toMatch(/^CR-/);
    expect(body.order.status).toBe('QUOTED');
    expect(Number(body.order.quotedPrice)).toBeGreaterThan(0);
    orderId = body.order.id;
  });

  it('lists own courier orders only', async () => {
    const own = await app.inject({
      method: 'GET',
      url: '/api/courier-orders',
      headers: { authorization: `Bearer ${token}` },
    });
    const ownBody = own.json() as { data: unknown[] };
    expect(ownBody.data.length).toBe(1);

    const other = await app.inject({
      method: 'GET',
      url: '/api/courier-orders',
      headers: { authorization: `Bearer ${otherToken}` },
    });
    const otherBody = other.json() as { data: unknown[] };
    expect(otherBody.data.length).toBe(0);
  });

  it('returns detail for owner, 404 for others', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/courier-orders/${orderId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);

    const res2 = await app.inject({
      method: 'GET',
      url: `/api/courier-orders/${orderId}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res2.statusCode).toBe(404);
  });
});

