import { logger as log } from '@appsemble/node-utils';

/**
 * Koa middleware for logging requests using the Appsemble logger.
 */
export default function logger() {
  return async (ctx, next) => {
    const start = Date.now();
    log.info(`${ctx.method} ${ctx.url}`);
    try {
      await next();
    } finally {
      let level;
      if (ctx.status < 300) {
        level = 'info';
      } else if (ctx.status < 500) {
        level = 'warn';
      } else {
        level = 'error';
      }
      const msg = `${ctx.method} ${ctx.url} ${ctx.status} ${ctx.message} ${Date.now() - start}ms`;
      log.log(level, msg);
    }
  };
}
