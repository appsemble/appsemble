import { bold, cyan, green, red, white, yellow } from 'chalk';
import type { ParameterizedContext } from 'koa';
import type * as compose from 'koa-compose';

import { logger } from './logger';

interface RangeMap<T> {
  [key: number]: T;
  default: T;
}

function rangeFormat<T>(value: number, map: RangeMap<T>): T {
  return Object.entries(map).find(([v]) => v === 'default' || value < Number(v))[1];
}

/**
 * Koa middleware for logging requests using the Appsemble logger.
 *
 * @returns Koa middleware for logging requests using the Appsemble logger.
 */
export function loggerMiddleware(): compose.Middleware<ParameterizedContext> {
  return (ctx, next) => {
    const { href, res } = ctx;
    const start = Date.now();
    const method = bold(ctx.method);
    logger.info(`${method} ${href} — ${white(ctx.ip)}`);

    function logResponse(): void {
      res.removeListener('finish', logResponse);
      res.removeListener('close', logResponse);

      const {
        message,
        response: {
          header: { location },
        },
        status,
      } = ctx;
      const s = `${status} ${message}`;
      const duration = Date.now() - start;

      const formatDuration = rangeFormat(duration, {
        100: green,
        1000: yellow,
        default: red,
      });

      const formatStatus = rangeFormat(status, {
        200: red,
        300: green,
        400: cyan,
        500: yellow,
        default: red,
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
