import { Context, Middleware } from 'koa';

export default function conditional(
  check: (ctx: Context) => boolean,
  middleware: Middleware,
): Middleware {
  return (ctx, next) => {
    if (check(ctx)) {
      return middleware(ctx, next);
    }
    return next();
  };
}
