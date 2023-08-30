import { type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createCssHandler(
  type: 'coreStyle' | 'sharedStyle',
  { getAppStyles }: Options,
): Middleware {
  return async (ctx: Context) => {
    const app = await getAppStyles({ context: ctx, query: { attributes: [type], raw: true } });

    if (!app) {
      ctx.response.status = 404;
      ctx.response.body = {
        statusCode: 404,
        error: 'Not Found',
        message: 'App not found',
      };
      ctx.throw();
    }

    ctx.body = app[type];
    ctx.type = 'css';
  };
}
