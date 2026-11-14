import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { paginated, parsePagination } from '../lib/pagination.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().min(1).max(120).optional(),
});

const paramsSlugSchema = z.object({ slug: z.string().min(1).max(120) });

const storeRoutes: FastifyPluginAsync = async (app) => {
  app.get('/stores', async (req) => {
    const query = listQuerySchema.parse(req.query);
    const p = parsePagination(query);

    const where: Record<string, unknown> = { isActive: true };
    const q = query.q;
    if (q) {
      where.OR = [
        { nameAr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      app.prisma.store.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: [{ isOpen: 'desc' }, { nameAr: 'asc' }],
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          description: true,
          logoUrl: true,
          isOpen: true,
          addressText: true,
          lat: true,
          lng: true,
        },
      }),
      app.prisma.store.count({ where }),
    ]);

    return paginated(items, total, p);
  });

  app.get('/stores/:slug', async (req, reply) => {
    const { slug } = paramsSlugSchema.parse(req.params);

    const store = await app.prisma.store.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        slug: true,
        nameAr: true,
        nameEn: true,
        description: true,
        logoUrl: true,
        phone: true,
        addressText: true,
        lat: true,
        lng: true,
        isOpen: true,
        openingHours: true,
        categories: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
          select: {
            id: true,
            slug: true,
            nameAr: true,
            nameEn: true,
            parentId: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!store) {
      return reply.status(404).send({ error: 'store_not_found' });
    }
    return { store };
  });
};

export default storeRoutes;
