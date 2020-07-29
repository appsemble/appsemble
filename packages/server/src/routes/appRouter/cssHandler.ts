import * as Boom from '@hapi/boom';

import type { KoaMiddleware } from '../../types';
import { getApp } from '../../utils/app';

export default function cssHandler(type: 'style' | 'sharedStyle'): KoaMiddleware {
  return async (ctx) => {
    const app = await getApp(ctx, { attributes: [type], raw: true });

    if (!app) {
      throw Boom.notFound();
    }

    ctx.body = app[type];
    ctx.type = 'css';
  };
}
