import { assertKoaCondition, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createCssHandler(
  type: 'coreStyle' | 'sharedStyle',
  { getAppStyles }: Options,
): Middleware {
  return async (ctx: Context) => {
    const app = await getAppStyles({ context: ctx, query: { attributes: [type], raw: true } });

    assertKoaCondition(!!app, ctx, 404, 'App not found');

    ctx.body = app[type];
    ctx.type = 'css';
  };
}
