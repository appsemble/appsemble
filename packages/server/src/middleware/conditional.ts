import { KoaContext, KoaMiddleware } from '../types';

export function conditional(
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
