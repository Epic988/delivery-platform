import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { calculateQuote } from '../services/pricing.js';
import { generateOrderNumber } from '../lib/orderNumber.js';
import { paginated, parsePagination } from '../lib/pagination.js';
import { isValidSudanesePhone, normalizeSudanesePhone } from '../lib/phone.js';

const phoneField = z
  .string()
  .transform(normalizeSudanesePhone)
  .refine(isValidSudanesePhone, { message: 'invalid_phone' });

const quoteSchema = z
  .object({
    zoneId: z.string().uuid().optional(),
    weightGrams: z.number().int().nonnegative().optional(),
    pickupLat: z.number().min(-90).max(90).optional(),
    pickupLng: z.number().min(-180).max(180).optional(),
    destLat: z.number().min(-90).max(90).optional(),
    destLng: z.number().min(-180).max(180).optional(),
  })
  .strict();

const createSchema = z
  .object({
    senderName: z.string().min(2).max(120),
    senderPhone: phoneField,
    recipientName: z.string().min(2).max(120),
    recipientPhone: phoneField,
    packageDescription: z.string().min(2).max(500),
    packageCategory: z.string().min(2).max(80),
    packageSize: z.enum(['ENVELOPE', 'SMALL', 'MEDIUM', 'LARGE', 'CUSTOM']),
    weightGrams: z.number().int().nonnegative().optional(),
    pickupAddressText: z.string().min(1).max(500),
    pickupLat: z.number().min(-90).max(90).optional(),
    pickupLng: z.number().min(-180).max(180).optional(),
    pickupNotes: z.string().max(500).optional(),
    destinationAddressText: z.string().min(1).max(500),
    destinationLat: z.number().min(-90).max(90).optional(),
    destinationLng: z.number().min(-180).max(180).optional(),
    destinationNotes: z.string().max(500).optional(),
    deliveryInstructions: z.string().max(500).optional(),
    specialHandlingNotes: z.string().max(500).optional(),
    zoneId: z.string().uuid().optional(),
  })
  .strict();

const idSchema = z.object({ id: z.string().uuid() });
const listSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const courierOrderRoutes: FastifyPluginAsync = async (app) => {
  app.post('/courier-orders/quote', { preHandler: [app.authenticate] }, async (req) => {
    const body = quoteSchema.parse(req.body);
    const price = await calculateQuote(app.prisma, {
      orderType: 'COURIER',
      zoneId: body.zoneId,
      weightGrams: body.weightGrams,
      pickupLat: body.pickupLat,
      pickupLng: body.pickupLng,
      destLat: body.destLat,
      destLng: body.destLng,
    });
    return { quotedPrice: price.toString(), currency: 'SDG' };
  });

  app.post(
    '/courier-orders',
    { preHandler: [app.requireRole(['CUSTOMER'])] },
    async (req, reply) => {
      const body = createSchema.parse(req.body);
      const userId = req.user.sub;

      const quotedPrice = await calculateQuote(app.prisma, {
        orderType: 'COURIER',
        zoneId: body.zoneId,
        weightGrams: body.weightGrams,
        pickupLat: body.pickupLat,
        pickupLng: body.pickupLng,
        destLat: body.destinationLat,
        destLng: body.destinationLng,
      });

      const order = await app.prisma.courierOrder.create({
        data: {
          orderNumber: generateOrderNumber('CR'),
          customerId: userId,
          senderName: body.senderName,
          senderPhone: body.senderPhone,
          recipientName: body.recipientName,
          recipientPhone: body.recipientPhone,
          packageDescription: body.packageDescription,
          packageCategory: body.packageCategory,
          packageSize: body.packageSize,
          weightGrams: body.weightGrams,
          pickupAddressText: body.pickupAddressText,
          pickupLat: body.pickupLat,
          pickupLng: body.pickupLng,
          pickupNotes: body.pickupNotes,
          destinationAddressText: body.destinationAddressText,
          destinationLat: body.destinationLat,
          destinationLng: body.destinationLng,
          destinationNotes: body.destinationNotes,
          deliveryInstructions: body.deliveryInstructions,
          specialHandlingNotes: body.specialHandlingNotes,
          zoneId: body.zoneId,
          status: 'QUOTED',
          quotedPrice,
          paymentMethod: 'CASH_ON_DELIVERY',
          events: {
            create: {
              orderType: 'COURIER',
              status: 'QUOTED',
              actorId: userId,
              note: 'created',
            },
          },
        },
      });

      return reply.status(201).send({ order });
    },
  );

  app.get('/courier-orders', { preHandler: [app.authenticate] }, async (req) => {
    const q = listSchema.parse(req.query);
    const p = parsePagination(q);
    const where = { customerId: req.user.sub };
    const [items, total] = await Promise.all([
      app.prisma.courierOrder.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.courierOrder.count({ where }),
    ]);
    return paginated(items, total, p);
  });

  app.get('/courier-orders/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = idSchema.parse(req.params);
    const order = await app.prisma.courierOrder.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } }, assignments: true },
    });
    if (!order || order.customerId !== req.user.sub) {
      return reply.status(404).send({ error: 'order_not_found' });
    }
    return { order };
  });
};

export default courierOrderRoutes;

