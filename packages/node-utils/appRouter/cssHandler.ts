import { notFound } from '@hapi/boom';
import { Context, Middleware } from 'koa';

import { AppRouterOptions } from '../types.js';

export function createCssHandler(
  type: 'coreStyle' | 'sharedStyle',
  { getApp }: AppRouterOptions,
): Middleware {
  return async (ctx: Context) => {
    const app = await getApp({ context: ctx, query: { attributes: [type] } });

    if (!app) {
      throw notFound('App not found');
    }

    ctx.body = app[type];
    ctx.type = 'css';
  };
}
