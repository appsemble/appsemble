import { type Middleware } from 'koa';

export function errorMiddleware(): Middleware {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error: unknown) {
      ctx.response.type = 'json';
      if (ctx.status && ctx.body) {
        ctx.app.emit('event', error, ctx);
      } else if (
        error instanceof Error &&
        error.message === 'Fields "subject" and "body" must be a valid string'
      ) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: 'Bad Request',
          message: 'Fields "subject" and "body" must be a valid string',
          statusCode: 400,
        };
        ctx.app.emit('event', error, ctx);
      } else {
        throw error;
      }
    }
  };
}
