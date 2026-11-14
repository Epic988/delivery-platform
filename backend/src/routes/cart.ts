import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const storeIdSchema = z.object({ storeId: z.string().uuid() });
const itemParamsSchema = z.object({ storeId: z.string().uuid(), productId: z.string().uuid() });
const addItemSchema = z
  .object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(999) })
  .strict();
const updateItemSchema = z.object({ quantity: z.number().int().min(0).max(999) }).strict();

async function getCustomer(app: { prisma: any }, userId: string) {
  const user = await app.prisma.user.findUnique({
    where: { id: userId },
    include: { customer: true },
  });
  return user?.customer ?? null;
}

const cartRoutes: FastifyPluginAsync = async (app) => {
  app.get('/carts', { preHandler: [app.requireRole(['CUSTOMER'])] }, async (req) => {
    const customer = await getCustomer(app, req.user.sub);
    if (!customer) return { data: [] };
    const data = await app.prisma.cart.findMany({
      where: { customerId: customer.id },
      include: {
        store: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                price: true,
                currency: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });
    return { data };
  });

  app.post(
    '/carts/:storeId/items',
    { preHandler: [app.requireRole(['CUSTOMER'])] },
    async (req, reply) => {
      const { storeId } = storeIdSchema.parse(req.params);
      const body = addItemSchema.parse(req.body);

      const customer = await getCustomer(app, req.user.sub);
      if (!customer) return reply.status(403).send({ error: 'customer_profile_required' });

      const [product, store] = await Promise.all([
        app.prisma.product.findUnique({ where: { id: body.productId } }),
        app.prisma.store.findUnique({ where: { id: storeId } }),
      ]);
      if (!product || !product.isAvailable) {
        return reply.status(400).send({ error: 'product_unavailable' });
      }
      if (product.storeId !== storeId) {
        return reply.status(400).send({ error: 'product_store_mismatch' });
      }
      if (!store || !store.isActive) {
        return reply.status(400).send({ error: 'store_inactive' });
      }
      if (product.stock !== null && product.stock < body.quantity) {
        return reply.status(400).send({ error: 'insufficient_stock', available: product.stock });
      }

      const cart = await app.prisma.cart.upsert({
        where: { customerId_storeId: { customerId: customer.id, storeId } },
        create: { customerId: customer.id, storeId },
        update: {},
      });

      const item = await app.prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: body.productId } },
        create: {
          cartId: cart.id,
          productId: body.productId,
          quantity: body.quantity,
          unitPrice: product.price,
        },
        update: { quantity: body.quantity, unitPrice: product.price },
      });

      return reply.status(201).send({ item, cartId: cart.id });
    },
  );

  app.patch(
    '/carts/:storeId/items/:productId',
    { preHandler: [app.requireRole(['CUSTOMER'])] },
    async (req, reply) => {
      const { storeId, productId } = itemParamsSchema.parse(req.params);
      const body = updateItemSchema.parse(req.body);

      const customer = await getCustomer(app, req.user.sub);
      if (!customer) return reply.status(403).send({ error: 'customer_profile_required' });

      const cart = await app.prisma.cart.findUnique({
        where: { customerId_storeId: { customerId: customer.id, storeId } },
      });
      if (!cart) return reply.status(404).send({ error: 'cart_not_found' });

      if (body.quantity === 0) {
        await app.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
        return reply.status(204).send();
      }

      const product = await app.prisma.product.findUnique({ where: { id: productId } });
      if (!product) return reply.status(404).send({ error: 'product_not_found' });
      if (product.stock !== null && product.stock < body.quantity) {
        return reply.status(400).send({ error: 'insufficient_stock', available: product.stock });
      }

      const existing = await app.prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });
      if (!existing) return reply.status(404).send({ error: 'item_not_found' });

      const item = await app.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: body.quantity, unitPrice: product.price },
      });
      return { item };
    },
  );

  app.delete(
    '/carts/:storeId/items/:productId',
    { preHandler: [app.requireRole(['CUSTOMER'])] },
    async (req, reply) => {
      const { storeId, productId } = itemParamsSchema.parse(req.params);
      const customer = await getCustomer(app, req.user.sub);
      if (!customer) return reply.status(403).send({ error: 'customer_profile_required' });

      const cart = await app.prisma.cart.findUnique({
        where: { customerId_storeId: { customerId: customer.id, storeId } },
      });
      if (!cart) return reply.status(404).send({ error: 'cart_not_found' });

      await app.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
      return reply.status(204).send();
    },
  );

  app.delete(
    '/carts/:storeId',
    { preHandler: [app.requireRole(['CUSTOMER'])] },
    async (req, reply) => {
      const { storeId } = storeIdSchema.parse(req.params);
      const customer = await getCustomer(app, req.user.sub);
      if (!customer) return reply.status(403).send({ error: 'customer_profile_required' });

      const cart = await app.prisma.cart.findUnique({
        where: { customerId_storeId: { customerId: customer.id, storeId } },
      });
      if (!cart) return reply.status(404).send({ error: 'cart_not_found' });

      await app.prisma.cart.delete({ where: { id: cart.id } });
      return reply.status(204).send();
    },
  );
};

export default cartRoutes;
