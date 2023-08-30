import { type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createBlockCssHandler({ getApp, getAppBlockStyles }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      params: { name },
    } = ctx;

    const app = await getApp({ context: ctx });

    if (!app) {
      ctx.response.status = 404;
      ctx.response.body = {
        statusCode: 404,
        error: 'Not Found',
        message: 'App not found',
      };
      ctx.throw();
    }

    const appBlockStyles = await getAppBlockStyles({ app, name, context: ctx });

    const [style] = appBlockStyles;
    ctx.body = style ? style.style : '';
    ctx.type = 'css';
  };
}
