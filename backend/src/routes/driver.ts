import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { assertTransition } from '../services/orderStateMachine.js';

const idSchema = z.object({ id: z.string().uuid() });
const availabilitySchema = z.object({ isAvailable: z.boolean() }).strict();

const statusPayloadSchema = z
  .object({
    status: z.enum([
      'ACCEPTED',
      'ARRIVING_AT_PICKUP',
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERED',
      'FAILED',
    ]),
    note: z.string().max(500).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .strict();

const proofSchema = z
  .object({
    recipientName: z.string().min(2).max(120).optional(),
    photoUrl: z.string().url().optional(),
    signatureUrl: z.string().url().optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();

const driverRoutes: FastifyPluginAsync = async (app) => {
  async function currentDriver(userId: string) {
    return app.prisma.driver.findUnique({ where: { userId } });
  }

  app.get(
    '/driver/me',
    { preHandler: [app.requireRole(['DRIVER'])] },
    async (req, reply) => {
      const driver = await currentDriver(req.user.sub);
      if (!driver) return reply.status(404).send({ error: 'driver_profile_missing' });
      const active = await app.prisma.assignment.findMany({
        where: { driverId: driver.id, isActive: true },
        include: {
          shoppingOrder: { select: { id: true, orderNumber: true, status: true } },
          courierOrder: { select: { id: true, orderNumber: true, status: true } },
        },
      });
      return { driver, activeAssignments: active };
    },
  );

  app.patch(
    '/driver/availability',
    { preHandler: [app.requireRole(['DRIVER'])] },
    async (req, reply) => {
      const body = availabilitySchema.parse(req.body);
      const driver = await currentDriver(req.user.sub);
      if (!driver) return reply.status(404).send({ error: 'driver_profile_missing' });
      const updated = await app.prisma.driver.update({
        where: { id: driver.id },
        data: { isAvailable: body.isAvailable },
      });
      return { driver: updated };
    },
  );

  app.get(
    '/driver/assignments',
    { preHandler: [app.requireRole(['DRIVER'])] },
    async (req, reply) => {
      const driver = await currentDriver(req.user.sub);
      if (!driver) return reply.status(404).send({ error: 'driver_profile_missing' });
      const data = await app.prisma.assignment.findMany({
        where: { driverId: driver.id, isActive: true },
        orderBy: { assignedAt: 'desc' },
        include: {
          shoppingOrder: true,
          courierOrder: true,
        },
      });
      return { data };
    },
  );

  app.post(
    '/driver/assignments/:id/accept',
    { preHandler: [app.requireRole(['DRIVER'])] },
    async (req, reply) => {
      const { id } = idSchema.parse(req.params);
      const driver = await currentDriver(req.user.sub);
      if (!driver) return reply.status(404).send({ error: 'driver_profile_missing' });

      const assignment = await app.prisma.assignment.findUnique({ where: { id } });
      if (!assignment || assignment.driverId !== driver.id || !assignment.isActive) {
        return reply.status(404).send({ error: 'assignment_not_found' });
      }
      if (assignment.status !== 'ASSIGNED') {
        return reply.status(409).send({ error: 'assignment_not_pending' });
      }

      const updated = await app.prisma.$transaction(async (tx) => {
        const a = await tx.assignment.update({
          where: { id },
          data: { status: 'ACCEPTED', acceptedAt: new Date(), respondedAt: new Date() },
        });
        if (assignment.shoppingOrderId) {
          const order = await tx.shoppingOrder.findUnique({ where: { id: assignment.shoppingOrderId } });
          if (order) {
            assertTransition(order.status, 'ACCEPTED');
            await tx.shoppingOrder.update({ where: { id: order.id }, data: { status: 'ACCEPTED' } });
            await tx.deliveryEvent.create({
              data: {
                orderType: 'SHOPPING',
                shoppingOrderId: order.id,
                status: 'ACCEPTED',
                actorId: req.user.sub,
                driverId: driver.id,
              },
            });
          }
        }
        if (assignment.courierOrderId) {
          const order = await tx.courierOrder.findUnique({ where: { id: assignment.courierOrderId } });
          if (order) {
            assertTransition(order.status, 'ACCEPTED');
            await tx.courierOrder.update({ where: { id: order.id }, data: { status: 'ACCEPTED' } });
            await tx.deliveryEvent.create({
              data: {
                orderType: 'COURIER',
                courierOrderId: order.id,
                status: 'ACCEPTED',
                actorId: req.user.sub,
                driverId: driver.id,
              },
            });
          }
        }
        return a;
      });

      return { assignment: updated };
    },
  );

  app.post(
    '/driver/assignments/:id/decline',
    { preHandler: [app.requireRole(['DRIVER'])] },
    async (req, reply) => {
      const { id } = idSchema.parse(req.params);
      const driver = await currentDriver(req.user.sub);
      if (!driver) return reply.status(404).send({ error: 'driver_profile_missing' });

      const assignment = await app.prisma.assignment.findUnique({ where: { id } });
      if (!assignment || assignment.driverId !== driver.id || !assignment.isActive) {
        return reply.status(404).send({ error: 'assignment_not_found' });
      }
      if (assignment.status !== 'ASSIGNED') {
        return reply.status(409).send({ error: 'assignment_not_pending' });
      }

      const updated = await app.prisma.assignment.update({
        where: { id },
        data: { status: 'DECLINED', isActive: false, respondedAt: new Date() },
      });
      return { assignment: updated };
    },
  );

  app.post(
    '/driver/assignments/:id/status',
    { preHandler: [app.requireRole(['DRIVER'])] },
    async (req, reply) => {
      const { id } = idSchema.parse(req.params);
      const body = statusPayloadSchema.parse(req.body);
      const driver = await currentDriver(req.user.sub);
      if (!driver) return reply.status(404).send({ error: 'driver_profile_missing' });

      const assignment = await app.prisma.assignment.findUnique({ where: { id } });
      if (!assignment || assignment.driverId !== driver.id || !assignment.isActive) {
        return reply.status(404).send({ error: 'assignment_not_found' });
      }

      const result = await app.prisma.$transaction(async (tx) => {
        let order;
        if (assignment.shoppingOrderId) {
          order = await tx.shoppingOrder.findUnique({ where: { id: assignment.shoppingOrderId } });
          if (!order) throw Object.assign(new Error('order_not_found'), { statusCode: 404 });
          assertTransition(order.status, body.status);
          const data: Prisma.ShoppingOrderUpdateInput = { status: body.status };
          if (body.status === 'DELIVERED') data.completedAt = new Date();
          if (body.status === 'FAILED') data.cancelledAt = new Date();
          order = await tx.shoppingOrder.update({ where: { id: order.id }, data });
          await tx.deliveryEvent.create({
            data: {
              orderType: 'SHOPPING',
              shoppingOrderId: order.id,
              status: body.status,
              actorId: req.user.sub,
              driverId: driver.id,
              note: body.note,
              lat: body.lat,
              lng: body.lng,
            },
          });
        } else if (assignment.courierOrderId) {
          order = await tx.courierOrder.findUnique({ where: { id: assignment.courierOrderId } });
          if (!order) throw Object.assign(new Error('order_not_found'), { statusCode: 404 });
          assertTransition(order.status, body.status);
          const data: Prisma.CourierOrderUpdateInput = { status: body.status };
          if (body.status === 'DELIVERED') {
            data.completedAt = new Date();
            if (order.quotedPrice !== null && order.finalPrice === null) {
              data.finalPrice = order.quotedPrice;
            }
          }
          if (body.status === 'FAILED') data.cancelledAt = new Date();
          order = await tx.courierOrder.update({ where: { id: order.id }, data });
          await tx.deliveryEvent.create({
            data: {
              orderType: 'COURIER',
              courierOrderId: order.id,
              status: body.status,
              actorId: req.user.sub,
              driverId: driver.id,
              note: body.note,
              lat: body.lat,
              lng: body.lng,
            },
          });
        } else {
          throw Object.assign(new Error('assignment_missing_order'), { statusCode: 500 });
        }

        const finalAssignmentStatus =
          body.status === 'DELIVERED'
            ? 'COMPLETED'
            : body.status === 'FAILED'
              ? 'FAILED'
              : 'ACCEPTED';
        const a = await tx.assignment.update({
          where: { id },
          data: {
            status: finalAssignmentStatus,
            isActive: body.status !== 'DELIVERED' && body.status !== 'FAILED',
            completedAt: body.status === 'DELIVERED' ? new Date() : assignment.completedAt,
          },
        });

        return { assignment: a, order };
      });

      return result;
    },
  );

  app.post(
    '/driver/assignments/:id/proof',
    { preHandler: [app.requireRole(['DRIVER'])] },
    async (req, reply) => {
      const { id } = idSchema.parse(req.params);
      const body = proofSchema.parse(req.body);
      const driver = await currentDriver(req.user.sub);
      if (!driver) return reply.status(404).send({ error: 'driver_profile_missing' });

      const assignment = await app.prisma.assignment.findUnique({ where: { id } });
      if (!assignment || assignment.driverId !== driver.id) {
        return reply.status(404).send({ error: 'assignment_not_found' });
      }

      const orderType = assignment.shoppingOrderId ? 'SHOPPING' : 'COURIER';
      const proof = await app.prisma.proofOfDelivery.create({
        data: {
          orderType,
          shoppingOrderId: assignment.shoppingOrderId,
          courierOrderId: assignment.courierOrderId,
          driverId: driver.id,
          recipientName: body.recipientName,
          photoUrl: body.photoUrl,
          signatureUrl: body.signatureUrl,
          notes: body.notes,
        },
      });
      return reply.status(201).send({ proof });
    },
  );
};

export default driverRoutes;
