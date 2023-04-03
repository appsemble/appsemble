import { notFound } from '@hapi/boom';
import { Context, Middleware } from 'koa';

import { AppRouterOptions } from '../types.js';

export function createCssHandler(
  type: 'coreStyle' | 'sharedStyle',
  { getAppStyles }: AppRouterOptions,
): Middleware {
  return async (ctx: Context) => {
    const app = await getAppStyles({ context: ctx, query: { attributes: [type], raw: true } });

    if (!app) {
      throw notFound('App not found');
    }

    ctx.body = app[type];
    ctx.type = 'css';
  };
}
