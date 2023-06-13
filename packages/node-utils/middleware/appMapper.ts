import { isIP } from 'node:net';

import { type Middleware } from 'koa';

export function appMapper(
  platformMiddleware: Middleware,
  appMiddleware: Middleware,
  argv: Record<string, any>,
): Middleware {
  return (ctx, next) => {
    const { hostname } = ctx;

    if (new URL(argv.host).hostname === hostname || isIP(hostname)) {
      return platformMiddleware(ctx, next);
    }

    return appMiddleware(ctx, next);
  };
}
