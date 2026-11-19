import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { calculateQuote } from '../services/pricing.js';
import { generateOrderNumber } from '../lib/orderNumber.js';
import { paginated, parsePagination } from '../lib/pagination.js';

const checkoutSchema = z
  .object({
    addressId: z.string().uuid(),
    zoneId: z.string().uuid().optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();

const idSchema = z.object({ id: z.string().uuid() });
const listSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const shoppingOrderRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/checkout',
    { preHandler: [app.requireRole(['CUSTOMER'])] },
    async (req, reply) => {
      const body = checkoutSchema.parse(req.body);
      const userId = req.user.sub;

      const [address, customer] = await Promise.all([
        app.prisma.address.findUnique({ where: { id: body.addressId } }),
        app.prisma.customer.findUnique({
          where: { userId },
          include: {
            carts: {
              include: {
                items: { include: { product: true } },
                store: { select: { id: true, isActive: true } },
              },
            },
          },
        }),
      ]);

      if (!address || address.userId !== userId) {
        return reply.status(404).send({ error: 'address_not_found' });
      }
      if (!customer || customer.carts.length === 0) {
        return reply.status(400).send({ error: 'no_items_in_cart' });
      }
      for (const cart of customer.carts) {
        if (!cart.store.isActive) {
          return reply.status(400).send({ error: 'store_inactive', storeId: cart.storeId });
        }
      }

      try {
        const result = await app.prisma.$transaction(async (tx) => {
          const group = await tx.checkoutGroup.create({
            data: { customerId: userId, totalAmount: 0, status: 'PENDING', notes: body.notes },
          });

          let groupTotal = new Prisma.Decimal(0);
          const orders = [];

          for (const cart of customer.carts) {
            const orderItems: Array<{
              productId: string;
              quantity: number;
              unitPrice: Prisma.Decimal;
              totalPrice: Prisma.Decimal;
            }> = [];

            for (const ci of cart.items) {
              const fresh = await tx.product.findUnique({ where: { id: ci.productId } });
              if (!fresh || !fresh.isAvailable || fresh.storeId !== cart.storeId) {
                throw Object.assign(new Error('product_unavailable'), { statusCode: 400 });
              }
              if (fresh.stock !== null && fresh.stock < ci.quantity) {
                throw Object.assign(new Error('insufficient_stock'), { statusCode: 400 });
              }
              const unitPrice = new Prisma.Decimal(fresh.price);
              orderItems.push({
                productId: fresh.id,
                quantity: ci.quantity,
                unitPrice,
                totalPrice: unitPrice.mul(ci.quantity),
              });
            }

            const subtotal = orderItems.reduce(
              (acc, it) => acc.add(it.totalPrice),
              new Prisma.Decimal(0),
            );
            const deliveryFee = await calculateQuote(tx, {
              orderType: 'SHOPPING',
              zoneId: body.zoneId ?? null,
            });
            const total = subtotal.add(deliveryFee);

            const order = await tx.shoppingOrder.create({
              data: {
                orderNumber: generateOrderNumber('SH'),
                customerId: userId,
                storeId: cart.storeId,
                addressId: body.addressId,
                zoneId: body.zoneId,
                checkoutGroupId: group.id,
                status: 'PENDING',
                subtotal,
                deliveryFee,
                total,
                paymentMethod: 'CASH_ON_DELIVERY',
                notes: body.notes,
                items: { create: orderItems },
                events: {
                  create: {
                    orderType: 'SHOPPING',
                    status: 'PENDING',
                    actorId: userId,
                    note: 'created',
                  },
                },
              },
              include: { items: true },
            });

            for (const it of orderItems) {
              const fresh = await tx.product.findUnique({ where: { id: it.productId } });
              if (fresh && fresh.stock !== null) {
                await tx.product.update({
                  where: { id: it.productId },
                  data: { stock: { decrement: it.quantity } },
                });
              }
            }

            await tx.cart.delete({ where: { id: cart.id } });
            groupTotal = groupTotal.add(total);
            orders.push(order);
          }

          const finalGroup = await tx.checkoutGroup.update({
            where: { id: group.id },
            data: { totalAmount: groupTotal, status: 'COMPLETED' },
          });

          return { checkoutGroup: finalGroup, orders };
        });

        return reply.status(201).send(result);
      } catch (err) {
        if (err instanceof Error && 'statusCode' in err) throw err;
        throw err;
      }
    },
  );

  app.get('/shopping-orders', { preHandler: [app.authenticate] }, async (req) => {
    const q = listSchema.parse(req.query);
    const p = parsePagination(q);
    const where = { customerId: req.user.sub };
    const [items, total] = await Promise.all([
      app.prisma.shoppingOrder.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { createdAt: 'desc' },
        include: { store: { select: { id: true, slug: true, nameAr: true, nameEn: true } } },
      }),
      app.prisma.shoppingOrder.count({ where }),
    ]);
    return paginated(items, total, p);
  });

  app.get('/shopping-orders/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = idSchema.parse(req.params);
    const order = await app.prisma.shoppingOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        events: { orderBy: { createdAt: 'asc' } },
        store: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
        address: true,
        checkoutGroup: true,
      },
    });
    if (!order || order.customerId !== req.user.sub) {
      return reply.status(404).send({ error: 'order_not_found' });
    }
    return { order };
  });
};

export default shoppingOrderRoutes;
