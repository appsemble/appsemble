import { notFound } from '@hapi/boom';

import { KoaMiddleware } from '../../types';
import { getApp } from '../../utils/app';

export function cssHandler(type: 'coreStyle' | 'sharedStyle'): KoaMiddleware {
  return async (ctx) => {
    const app = await getApp(ctx, { attributes: [type], raw: true });

    if (!app) {
      throw notFound();
    }

    ctx.body = app[type];
    ctx.type = 'css';
  };
}
