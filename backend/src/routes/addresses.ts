import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const addressFields = {
  label: z.string().max(80).optional(),
  addressText: z.string().min(1).max(500),
  city: z.string().max(120).optional(),
  district: z.string().max(120).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(1000).optional(),
  isDefault: z.boolean().optional(),
};

const createSchema = z.object(addressFields).strict();
const updateSchema = z.object(addressFields).partial().strict();
const idSchema = z.object({ id: z.string().uuid() });

const addressRoutes: FastifyPluginAsync = async (app) => {
  app.get('/addresses', { preHandler: [app.authenticate] }, async (req) => {
    const data = await app.prisma.address.findMany({
      where: { userId: req.user.sub },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return { data };
  });

  app.post('/addresses', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = createSchema.parse(req.body);
    const userId = req.user.sub;

    if (body.isDefault) {
      await app.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await app.prisma.address.create({ data: { ...body, userId } });

    if (body.isDefault) {
      await app.prisma.customer.updateMany({
        where: { userId },
        data: { defaultAddressId: address.id },
      });
    }

    return reply.status(201).send({ address });
  });

  app.get('/addresses/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = idSchema.parse(req.params);
    const address = await app.prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== req.user.sub) {
      return reply.status(404).send({ error: 'address_not_found' });
    }
    return { address };
  });

  app.patch('/addresses/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = idSchema.parse(req.params);
    const body = updateSchema.parse(req.body);

    const existing = await app.prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.sub) {
      return reply.status(404).send({ error: 'address_not_found' });
    }

    if (body.isDefault === true) {
      await app.prisma.address.updateMany({
        where: { userId: req.user.sub, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const address = await app.prisma.address.update({ where: { id }, data: body });

    if (body.isDefault === true) {
      await app.prisma.customer.updateMany({
        where: { userId: req.user.sub },
        data: { defaultAddressId: address.id },
      });
    }

    return { address };
  });

  app.delete('/addresses/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = idSchema.parse(req.params);
    const existing = await app.prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.sub) {
      return reply.status(404).send({ error: 'address_not_found' });
    }
    await app.prisma.address.delete({ where: { id } });
    return reply.status(204).send();
  });
};

export default addressRoutes;
