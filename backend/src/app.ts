import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import prismaPlugin from './plugins/prisma.js';
import authPlugin from './plugins/auth.js';
import errorHandler from './plugins/errorHandler.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';

export async function buildApp() {
  const app = Fastify({
    logger: { level: config.logLevel },
    trustProxy: config.trustProxy,
    bodyLimit: 5 * 1024 * 1024,
  });

  await app.register(helmet, { contentSecurityPolicy: false });

  const allowedOrigins =
    config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim());

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: config.corsOrigin !== '*',
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  });

  await app.register(prismaPlugin);
  await app.register(errorHandler);
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(storeRoutes, { prefix: '/api' });
  await app.register(productRoutes, { prefix: '/api' });
  await app.register(categoryRoutes, { prefix: '/api' });

  return app;
}
