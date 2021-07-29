import { notFound } from '@hapi/boom';
import { Middleware } from 'koa';

import { getApp } from '../../utils/app';

export function cssHandler(type: 'coreStyle' | 'sharedStyle'): Middleware {
  return async (ctx) => {
    const { app } = await getApp(ctx, { attributes: [type], raw: true });

    if (!app) {
      throw notFound('App not found');
    }

    ctx.body = app[type];
    ctx.type = 'css';
  };
}
