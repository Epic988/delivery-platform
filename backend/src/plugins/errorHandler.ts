import fp from 'fastify-plugin';
import { ZodError } from 'zod';

export default fp(async (app) => {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'validation_error',
        details: error.flatten(),
      });
    }

    const status = typeof error.statusCode === 'number' ? error.statusCode : 500;
    if (status >= 500) {
      app.log.error(error);
      return reply.status(500).send({ error: 'internal_error' });
    }

    return reply.status(status).send({
      error: error.code ?? 'request_error',
      message: error.message,
    });
  });
});
