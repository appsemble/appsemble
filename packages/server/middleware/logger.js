import { logger as log } from '@appsemble/node-utils';

/**
 * Koa middleware for logging requests using the Appsemble logger.
 */
export default function logger() {
  return async (ctx, next) => {
    const start = Date.now();
    log.info(`${ctx.method} ${ctx.url}`);

    function message(status, msg) {
      let level;
      if (status < 300) {
        level = 'info';
      } else if (status < 500) {
        level = 'warn';
      } else {
        level = 'error';
      }
      log.log(level, `${ctx.method} ${ctx.url} ${status} ${msg} ${Date.now() - start}ms`);
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
