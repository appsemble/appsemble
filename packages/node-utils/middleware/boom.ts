import { type Boom } from '@hapi/boom';
import { type Middleware } from 'koa';

import { SCIMError } from '../scim.js';

/**
 * Koa middleware for handling Boom errors.
 *
 * @returns Koa middleware that converts Boom errors into an HTTP response.
 */
export function boomMiddleware(): Middleware {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error: unknown) {
      if (error instanceof SCIMError) {
        ctx.status = Number(error.status);
        ctx.body = error;
        return;
      }
      const err = error as Boom;
      if (!err.isBoom) {
        throw err;
      }
      const { output } = err;
      ctx.status = output.statusCode;
      ctx.body = output.payload;
      if (err.data) {
        (ctx.body as any).data = err.data;
      }
      ctx.set(output.headers as Record<string, string>);
    }
  };
}
