import type { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({
    status: 'ok',
    time: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  app.get('/ready', async (req, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch (err) {
      req.log.error(err);
      return reply.status(503).send({ status: 'not_ready', error: 'db_unavailable' });
    }
  });
};

export default healthRoutes;
