import isIp from 'is-ip';
import { URL } from 'url';

import type { KoaMiddleware } from '../types';

export default function appMapper(
  platformMiddleware: KoaMiddleware,
  appMiddleware: KoaMiddleware,
): KoaMiddleware {
  return async (ctx, next) => {
    const { argv, hostname } = ctx;

    if (new URL(argv.host).hostname === hostname || isIp(hostname)) {
      return platformMiddleware(ctx, next);
    }
    return appMiddleware(ctx, next);
  };
}
