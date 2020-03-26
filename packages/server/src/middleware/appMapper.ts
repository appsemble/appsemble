import isIp from 'is-ip';
import { Middleware } from 'koa';

export default function appMapper(
  platformMiddleware: Middleware,
  appMiddleware: Middleware,
): Middleware {
  return async (ctx, next) => {
    const { argv, hostname } = ctx;

    if (new URL(argv.host).hostname === hostname || isIp(hostname)) {
      return platformMiddleware(ctx, next);
    }
    return appMiddleware(ctx, next);
  };
}
