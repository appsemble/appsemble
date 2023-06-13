import { type Context, type Middleware } from 'koa';

export function conditional(check: (ctx: Context) => boolean, middleware: Middleware): Middleware {
  return (ctx, next) => {
    if (check(ctx)) {
      return middleware(ctx, next);
    }
    return next();
  };
}
