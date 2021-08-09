import { URL } from 'url';

import isIp from 'is-ip';
import { Middleware } from 'koa';

import { argv } from '../utils/argv';

export function appMapper(platformMiddleware: Middleware, appMiddleware: Middleware): Middleware {
  return (ctx, next) => {
    const { hostname } = ctx;

    if (new URL(argv.host).hostname === hostname || isIp(hostname)) {
      return platformMiddleware(ctx, next);
    }
    return appMiddleware(ctx, next);
  };
}
