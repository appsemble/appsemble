import chalk from 'chalk';
import { type ParameterizedContext } from 'koa';
import type * as compose from 'koa-compose';

import { logger } from '../logger.js';

interface RangeMap<T> {
  [key: number]: T;
  default: T;
}

function rangeFormat<T>(value: number, map: RangeMap<T>): T {
  // @ts-expect-error 2532 Object is possibly 'undefined'.
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
    const method = chalk.bold(ctx.method);
    logger.info(`${method} ${href} — ${chalk.white(ctx.ip)}`);

    function logResponse(): void {
      res.removeListener('finish', logResponse);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      res.removeListener('close', logCancel);

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

    function logCancel(): void {
      res.removeListener('finish', logResponse);
      res.removeListener('close', logCancel);

      const duration = Date.now() - start;
      const formatDuration = rangeFormat(duration, {
        100: chalk.green,
        1000: chalk.yellow,
        default: chalk.red,
      });

      logger.warn(
        `${method} ${href} ${chalk.grey('Cancelled')} ${formatDuration(`${duration}ms`)}`,
      );
    }

    res.once('finish', logResponse);
    res.once('close', logCancel);

    return next();
  };
}
