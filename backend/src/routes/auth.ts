import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { isValidSudanesePhone, normalizeSudanesePhone } from '../lib/phone.js';

const phoneField = z
  .string()
  .transform(normalizeSudanesePhone)
  .refine(isValidSudanesePhone, { message: 'Phone must be a valid Sudanese number (+249XXXXXXXXX)' });

const registerSchema = z.object({
  phone: phoneField,
  fullName: z.string().min(2).max(120),
  password: z.string().min(8).max(128),
  email: z.string().email().optional(),
  language: z.enum(['ar', 'en']).default('ar'),
});

const loginSchema = z.object({
  phone: phoneField,
  password: z.string().min(1),
});

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body);

    const existing = await app.prisma.user.findUnique({ where: { phone: body.phone } });
    if (existing) {
      return reply.status(409).send({ error: 'phone_already_registered' });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await app.prisma.user.create({
      data: {
        phone: body.phone,
        email: body.email,
        fullName: body.fullName,
        passwordHash,
        role: 'CUSTOMER',
        language: body.language,
        customer: { create: {} },
      },
      select: {
        id: true,
        phone: true,
        fullName: true,
        role: true,
        language: true,
        createdAt: true,
      },
    });

    const token = app.jwt.sign({ sub: user.id, role: 'CUSTOMER' }, { expiresIn: config.jwtExpiresIn });
    return reply.status(201).send({ user, token });
  });

  app.post('/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const user = await app.prisma.user.findUnique({ where: { phone: body.phone } });

    if (!user || user.status !== 'ACTIVE') {
      return reply.status(401).send({ error: 'invalid_credentials' });
    }

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return reply.status(401).send({ error: 'invalid_credentials' });

    const token = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: config.jwtExpiresIn });
    return reply.send({
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        language: user.language,
      },
      token,
    });
  });

  app.get('/auth/me', { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user;
    const user = await app.prisma.user.findUnique({
      where: { id: sub },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        role: true,
        language: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw Object.assign(new Error('user_not_found'), { statusCode: 404 });
    }
    return { user };
  });
};

export default authRoutes;
