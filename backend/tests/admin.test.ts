import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app.js';
import { hashPassword } from '../src/lib/password.js';

const prisma = new PrismaClient();
let app: FastifyInstance;

const ADMIN_PHONE = '+249990000501';
const CUSTOMER_PHONE = '+249990000502';
const DRIVER_PHONE = '+249990000503';
const PASSWORD = 'Password123!';
const SLUG = 'test-admin-store';

let adminToken: string;
let customerToken: string;
let storeId: string;
let driverId: string;
let adminUserId: string;

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { phone: { in: [ADMIN_PHONE, CUSTOMER_PHONE, DRIVER_PHONE] } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    await prisma.shoppingOrder.deleteMany({ where: { customerId: { in: ids } } });
    await prisma.courierOrder.deleteMany({ where: { customerId: { in: ids } } });
    await prisma.checkoutGroup.deleteMany({ where: { customerId: { in: ids } } });
    await prisma.address.deleteMany({ where: { userId: { in: ids } } });
    await prisma.assignment.deleteMany({ where: { driverId: { in: (await prisma.driver.findMany({ where: { userId: { in: ids } }, select: { id: true } })).map((d) => d.id) } } });
    await prisma.driver.deleteMany({ where: { userId: { in: ids } } });
  }
  await prisma.store.deleteMany({ where: { slug: SLUG } });
  await prisma.user.deleteMany({ where: { phone: { in: [ADMIN_PHONE, CUSTOMER_PHONE, DRIVER_PHONE] } } });
}

beforeAll(async () => {
  await cleanup();

  // Admin created directly (as a real operator would)
  const passwordHash = await hashPassword(PASSWORD);
  const admin = await prisma.user.create({
    data: {
      phone: ADMIN_PHONE,
      fullName: 'Admin',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  adminUserId = admin.id;

  app = await buildApp();
  await app.ready();

  const login = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { phone: ADMIN_PHONE, password: PASSWORD },
  });
  adminToken = (login.json() as { token: string }).token;

  const cust = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { phone: CUSTOMER_PHONE, fullName: 'Customer', password: PASSWORD },
  });
  customerToken = (cust.json() as { token: string }).token;
});

afterAll(async () => {
  await cleanup();
  await app.close();
  await prisma.$disconnect();
});

describe('admin', () => {
  it('rejects customers from admin stats (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/stats',
      headers: { authorization: `Bearer ${customerToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('rejects unauthenticated from admin stats (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/stats' });
    expect(res.statusCode).toBe(401);
  });

  it('returns stats for admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/stats',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { customers: number; stores: number };
    expect(body.customers).toBeGreaterThanOrEqual(1);
  });

  it('creates a store', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/stores',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        slug: SLUG,
        nameAr: 'متجر الإدارة',
        nameEn: 'Admin Store',
        addressText: 'Khartoum',
        lat: 15.5,
        lng: 32.5,
      },
    });
    expect(res.statusCode).toBe(201);
    storeId = (res.json() as { store: { id: string } }).store.id;
  });

  it('creates a product in the store', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/stores/${storeId}/products`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { nameAr: 'Product', price: 500, stock: 5 },
    });
    expect(res.statusCode).toBe(201);
  });

  it('creates a driver profile', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/drivers',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        phone: DRIVER_PHONE,
        fullName: 'Driver One',
        password: PASSWORD,
        vehicleType: 'MOTORCYCLE',
        isVerified: true,
      },
    });
    expect(res.statusCode).toBe(201);
    const driverRecord = await prisma.driver.findFirst({ where: { user: { phone: DRIVER_PHONE } } });
    expect(driverRecord).toBeTruthy();
    driverId = driverRecord!.id;
  });

  it('suspends a customer', async () => {
    const list = await app.inject({
      method: 'GET',
      url: `/api/admin/users?role=CUSTOMER`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const users = (list.json() as { data: Array<{ id: string; phone: string }> }).data;
    const cust = users.find((u) => u.phone === CUSTOMER_PHONE)!;
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${cust.id}/status`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'SUSPENDED' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('suspended user cannot log in', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { phone: CUSTOMER_PHONE, password: PASSWORD },
    });
    expect(res.statusCode).toBe(401);
  });
});
