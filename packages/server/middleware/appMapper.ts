import { isIP } from 'node:net';

import { type Middleware } from 'koa';

import { AppCollection } from '../models/main/AppCollection.js';
import { argv } from '../utils/argv.js';

export function appMapper(platformMiddleware: Middleware, appMiddleware: Middleware): Middleware {
  return async (ctx, next) => {
    const { hostname } = ctx;
    const normalizedHostname = hostname.toLowerCase();

    if (new URL(argv.host).hostname === normalizedHostname || isIP(hostname)) {
      return platformMiddleware(ctx, next);
    }

    const collection = await AppCollection.findOne({
      where: { domain: normalizedHostname },
      attributes: ['id'],
    });

    if (collection) {
      ctx.state.appCollectionId = collection.id;
      return platformMiddleware(ctx, next);
    }

    return appMiddleware(ctx, next);
  };
}
