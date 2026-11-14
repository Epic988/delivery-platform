import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const listQuerySchema = z.object({
  storeId: z.string().uuid().optional(),
  storeSlug: z.string().min(1).max(120).optional(),
  parentId: z.string().uuid().optional(),
});

const categoryRoutes: FastifyPluginAsync = async (app) => {
  app.get('/categories', async (req) => {
    const query = listQuerySchema.parse(req.query);

    let storeId = query.storeId;
    if (!storeId && query.storeSlug) {
      const store = await app.prisma.store.findUnique({
        where: { slug: query.storeSlug },
        select: { id: true },
      });
      if (!store) return { data: [] };
      storeId = store.id;
    }

    const where: Record<string, unknown> = { isActive: true };
    if (storeId) where.storeId = storeId;
    if (query.parentId) where.parentId = query.parentId;

    const data = await app.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
      select: {
        id: true,
        slug: true,
        nameAr: true,
        nameEn: true,
        parentId: true,
        storeId: true,
        sortOrder: true,
      },
    });

    return { data };
  });
};

export default categoryRoutes;
