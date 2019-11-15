import chalk from 'chalk';

import { logger } from './logger';

/**
 * Koa middleware for logging requests using the Appsemble logger.
 */
export default function loggerMiddleware() {
  return async (ctx, next) => {
    const start = Date.now();
    const method = chalk.bold(ctx.method);
    logger.info(`${method} ${ctx.href} — ${chalk.white(ctx.ip)}`);

    function message(status, msg) {
      const s = `${status} ${msg}`;
      let duration = Date.now() - start;
      if (duration < 100) {
        duration = chalk.green(`${duration}ms`);
      } else if (duration < 1000) {
        duration = chalk.yellow(`${duration}ms`);
      } else {
        duration = chalk.red(`${duration}ms`);
      }
      const format = st => `${method} ${ctx.href} ${st} ${duration}`;
      if (status < 300) {
        logger.info(format(chalk.green(s)));
      } else if (status < 400) {
        const { location } = ctx.response.headers;
        if (location) {
          logger.info(format(chalk.cyan(`${s} → ${location}`)));
        } else {
          logger.info(format(chalk.cyan(s)));
        }
      } else if (status < 500) {
        logger.warn(format(chalk.yellow(s)));
      } else {
        logger.error(format(chalk.red(s)));
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
