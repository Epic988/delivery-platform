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
import addressRoutes from './routes/addresses.js';
import cartRoutes from './routes/cart.js';
import shoppingOrderRoutes from './routes/shopping-orders.js';
import courierOrderRoutes from './routes/courier-orders.js';
import driverRoutes from './routes/driver.js';
import adminRoutes from './routes/admin.js';

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
    allowList: (req) => req.url === '/api/auth/login',
  });

  await app.register(prismaPlugin);
  await app.register(errorHandler);
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(storeRoutes, { prefix: '/api' });
  await app.register(productRoutes, { prefix: '/api' });
  await app.register(categoryRoutes, { prefix: '/api' });
  await app.register(addressRoutes, { prefix: '/api' });
  await app.register(cartRoutes, { prefix: '/api' });
  await app.register(shoppingOrderRoutes, { prefix: '/api' });
  await app.register(courierOrderRoutes, { prefix: '/api' });
  await app.register(driverRoutes, { prefix: '/api' });
  await app.register(adminRoutes, { prefix: '/api' });

  return app;
}


