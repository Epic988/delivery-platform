import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app.js';

const prisma = new PrismaClient();
let app: FastifyInstance;

const STORE_SLUG = 'test-store-catalog';

async function cleanup() {
  await prisma.store.deleteMany({ where: { slug: STORE_SLUG } });
}

async function seed() {
  return prisma.store.create({
    data: {
      slug: STORE_SLUG,
      nameAr: 'متجر الاختبار',
      nameEn: 'Test Store',
      addressText: 'Khartoum',
      lat: 15.5007,
      lng: 32.5599,
      isActive: true,
      isOpen: true,
      categories: {
        create: [
          { slug: 'cat-a', nameAr: 'فئة أ', nameEn: 'Category A', sortOrder: 1 },
          { slug: 'cat-b', nameAr: 'فئة ب', nameEn: 'Category B', sortOrder: 2 },
        ],
      },
      products: {
        create: [
          { nameAr: 'منتج 1', nameEn: 'Product One', price: 1000, currency: 'SDG', isAvailable: true, stock: 10 },
          { nameAr: 'منتج 2', nameEn: 'Product Two', price: 2000, currency: 'SDG', isAvailable: true, stock: 5 },
          { nameAr: 'منتج 3', nameEn: 'Product Three', price: 3000, currency: 'SDG', isAvailable: false, stock: 0 },
        ],
      },
    },
  });
}

beforeAll(async () => {
  await cleanup();
  await seed();
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await cleanup();
  await prisma.$disconnect();
});

describe('public catalog', () => {
  it('lists active stores with pagination envelope', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stores' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: Array<{ slug: string }>;
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    };
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.pageSize).toBe(20);
    expect(body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(body.data.some((s) => s.slug === STORE_SLUG)).toBe(true);
  });

  it('returns store details with categories', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/stores/${STORE_SLUG}` });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { store: { slug: string; categories: unknown[] } };
    expect(body.store.slug).toBe(STORE_SLUG);
    expect(body.store.categories.length).toBeGreaterThanOrEqual(2);
  });

  it('returns 404 for unknown store slug', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stores/definitely-not-a-store' });
    expect(res.statusCode).toBe(404);
  });

  it('lists only available products of active stores', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/products?storeSlug=${STORE_SLUG}` });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: Array<{ nameEn: string }>;
      pagination: { total: number };
    };
    expect(body.pagination.total).toBe(2);
    const names = body.data.map((p) => p.nameEn);
    expect(names).toContain('Product One');
    expect(names).toContain('Product Two');
    expect(names).not.toContain('Product Three');
  });

  it('searches products by query string', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/products?storeSlug=${STORE_SLUG}&q=Product One`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: Array<{ nameEn: string }> };
    expect(body.data.length).toBe(1);
    expect(body.data[0]?.nameEn).toBe('Product One');
  });

  it('filters products by price range', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/products?storeSlug=${STORE_SLUG}&minPrice=1500&maxPrice=2500`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: Array<{ nameEn: string }> };
    expect(body.data.length).toBe(1);
    expect(body.data[0]?.nameEn).toBe('Product Two');
  });

  it('returns product detail by id', async () => {
    const store = await prisma.store.findUnique({
      where: { slug: STORE_SLUG },
      include: { products: { where: { nameEn: 'Product One' } } },
    });
    const productId = store?.products[0]?.id;
    expect(productId).toBeTruthy();
    const res = await app.inject({ method: 'GET', url: `/api/products/${productId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { product: { nameEn: string } };
    expect(body.product.nameEn).toBe('Product One');
  });

  it('returns categories for a store slug', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/categories?storeSlug=${STORE_SLUG}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: unknown[] };
    expect(body.data.length).toBe(2);
  });
});
