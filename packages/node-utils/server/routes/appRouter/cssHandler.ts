import { type Options } from '@appsemble/node-utils';
import { notFound } from '@hapi/boom';
import { type Context, type Middleware } from 'koa';

export function createCssHandler(
  type: 'coreStyle' | 'sharedStyle',
  { getAppStyles }: Options,
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
