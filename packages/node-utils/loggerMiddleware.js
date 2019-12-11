import chalk from 'chalk';

import { logger } from './logger';

function rangeFormat(value, colorMap) {
  return Object.entries(colorMap).find(([v]) => v === 'default' || value < Number(v))[1];
}

/**
 * Koa middleware for logging requests using the Appsemble logger.
 */
export default function loggerMiddleware() {
  return async (ctx, next) => {
    const { href, res } = ctx;
    const start = Date.now();
    const method = chalk.bold(ctx.method);
    logger.info(`${method} ${href} — ${chalk.white(ctx.ip)}`);

    function logResponse() {
      res.removeListener('finish', logResponse);
      res.removeListener('close', logResponse);

      const { message, status } = ctx;
      const s = `${status} ${message}`;
      const { location } = ctx.response.headers;
      const duration = Date.now() - start;

      const formatDuration = rangeFormat(duration, {
        100: chalk.green,
        1000: chalk.yellow,
        default: chalk.red,
      });

      const formatStatus = rangeFormat(status, {
        200: chalk.red,
        300: chalk.green,
        400: chalk.cyan,
        500: chalk.yellow,
        default: chalk.red,
      });

      const level = rangeFormat(status, {
        200: 'error',
        400: 'info',
        500: 'warn',
        default: 'error',
      });

      logger.log(
        level,
        `${method} ${href} ${formatStatus(location ? `${s} → ${location}` : s)} ${formatDuration(
          `${duration}ms`,
        )}`,
      );
    }

    res.once('finish', logResponse);
    res.once('close', logResponse);

    return next();
  };
}
