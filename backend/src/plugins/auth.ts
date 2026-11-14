import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyRequest } from 'fastify';
import { config } from '../config.js';

export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'STORE_OWNER';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => Promise<void>;
    requireRole: (roles: Role[]) => (req: FastifyRequest) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: Role };
    user: { sub: string; role: Role };
  }
}

export default fp(async (app) => {
  await app.register(fastifyJwt, { secret: config.jwtSecret });

  app.decorate('authenticate', async (req: FastifyRequest) => {
    await req.jwtVerify();
  });

  app.decorate('requireRole', (roles: Role[]) => {
    return async (req: FastifyRequest) => {
      await req.jwtVerify();
      // Re-verify role from database; never trust stale JWT claims.
      const user = await app.prisma.user.findUnique({
        where: { id: req.user.sub },
        select: { role: true, status: true },
      });
      if (!user || user.status !== 'ACTIVE' || !roles.includes(user.role as Role)) {
        throw Object.assign(new Error('forbidden'), { statusCode: 403 });
      }
      req.user.role = user.role as Role;
    };
  });
});
