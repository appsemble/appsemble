import { URL } from 'url';

import isIp from 'is-ip';

import { KoaMiddleware } from '../types';
import { argv } from '../utils/argv';

export function appMapper(
  platformMiddleware: KoaMiddleware,
  appMiddleware: KoaMiddleware,
): KoaMiddleware {
  return (ctx, next) => {
    const { hostname } = ctx;

    if (new URL(argv.host).hostname === hostname || isIp(hostname)) {
      return platformMiddleware(ctx, next);
    }
    return appMiddleware(ctx, next);
  };
}
