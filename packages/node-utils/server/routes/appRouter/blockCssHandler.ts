import { notFound } from '@hapi/boom';
import { Context, Middleware } from 'koa';

import { AppRouterOptions } from '../types.js';

export function createBlockCssHandler({ getApp, getAppBlockStyles }: AppRouterOptions): Middleware {
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
