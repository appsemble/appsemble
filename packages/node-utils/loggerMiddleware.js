import { logger } from './logger';

/**
 * Koa middleware for logging requests using the Appsemble logger.
 */
export default function loggerMiddleware() {
  return async (ctx, next) => {
    const start = Date.now();
    logger.info(`${ctx.method} ${ctx.href} — ${ctx.ip}`);

    function message(status, msg) {
      const formattedMessage = `${ctx.method} ${ctx.href} ${status} ${msg} ${Date.now() - start}ms`;
      if (status < 300) {
        logger.info(formattedMessage);
      } else if (status < 500) {
        logger.warn(formattedMessage);
      } else {
        logger.error(formattedMessage);
      }
    }

    try {
      await next();
    } catch (error) {
      message(500, 'Internal Server Error');
      throw error;
    }
    message(ctx.status, ctx.message);
  };
}
