import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { paginated, parsePagination } from '../lib/pagination.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().min(1).max(120).optional(),
  storeId: z.string().uuid().optional(),
  storeSlug: z.string().min(1).max(120).optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

const paramsIdSchema = z.object({ id: z.string().uuid() });

const productRoutes: FastifyPluginAsync = async (app) => {
  app.get('/products', async (req) => {
    const query = listQuerySchema.parse(req.query);
    const p = parsePagination(query);

    let storeId = query.storeId;
    if (!storeId && query.storeSlug) {
      const store = await app.prisma.store.findUnique({
        where: { slug: query.storeSlug },
        select: { id: true },
      });
      if (!store) return paginated([], 0, p);
      storeId = store.id;
    }

    const where: Record<string, unknown> = {
      isAvailable: true,
      store: { isActive: true },
    };
    if (storeId) where.storeId = storeId;
    if (query.categoryId) where.categoryId = query.categoryId;

    const q = query.q;
    if (q) {
      where.OR = [
        { nameAr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const price: Record<string, number> = {};
      if (query.minPrice !== undefined) price.gte = query.minPrice;
      if (query.maxPrice !== undefined) price.lte = query.maxPrice;
      where.price = price;
    }

    const [items, total] = await Promise.all([
      app.prisma.product.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          description: true,
          price: true,
          compareAtPrice: true,
          currency: true,
          imageUrl: true,
          stock: true,
          weightGrams: true,
          storeId: true,
          categoryId: true,
          store: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
        },
      }),
      app.prisma.product.count({ where }),
    ]);

    return paginated(items, total, p);
  });

  app.get('/products/:id', async (req, reply) => {
    const { id } = paramsIdSchema.parse(req.params);

    const product = await app.prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            slug: true,
            nameAr: true,
            nameEn: true,
            isActive: true,
            isOpen: true,
          },
        },
        category: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
      },
    });

    if (!product || !product.isAvailable || !product.store.isActive) {
      return reply.status(404).send({ error: 'product_not_found' });
    }
    return { product };
  });
};

export default productRoutes;
