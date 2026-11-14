import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyRequest } from 'fastify';
import { config } from '../config.js';

type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'STORE_OWNER';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => Promise<void>;
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
});
