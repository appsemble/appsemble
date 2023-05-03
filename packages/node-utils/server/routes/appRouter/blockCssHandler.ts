import { type Options } from '@appsemble/node-utils';
import { notFound } from '@hapi/boom';
import { type Context, type Middleware } from 'koa';

export function createBlockCssHandler({ getApp, getAppBlockStyles }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      params: { name },
    } = ctx;

    const app = await getApp({ context: ctx });

    if (!app) {
      throw notFound('App not found');
    }

    const appBlockStyles = await getAppBlockStyles({ app, name, context: ctx });

    const [style] = appBlockStyles;
    ctx.body = style ? style.style : '';
    ctx.type = 'css';
  };
}
