import type { KoaContext, KoaMiddleware } from '../types';

export default function conditional(
  check: (ctx: KoaContext) => boolean,
  middleware: KoaMiddleware,
): KoaMiddleware {
  return (ctx, next) => {
    if (check(ctx)) {
      return middleware(ctx, next);
    }
    return next();
  };
}
