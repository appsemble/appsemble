import type { Boom } from '@hapi/boom';

import type { KoaMiddleware } from '../types';

/**
 * Koa middleware for handling Boom errors.
 *
 * @returns Koa middleware that converts Boom errors into an HTTP response.
 */
export function boomMiddleware(): KoaMiddleware {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error: unknown) {
      const err = error as Boom;
      if (!err.isBoom) {
        throw err;
      }
      const { output } = err;
      ctx.status = output.statusCode;
      ctx.body = output.payload;
      if (err.data) {
        ctx.body.data = err.data;
      }
      ctx.set(output.headers as { [key: string]: string });
    }
  };
}
