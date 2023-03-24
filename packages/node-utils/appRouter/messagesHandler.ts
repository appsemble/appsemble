import { notFound } from '@hapi/boom';
import { Context, Middleware } from 'koa';

import { AppRouterOptions } from '../types.js';

export function createMessagesHandler({ getApp, getAppMessages }: AppRouterOptions): Middleware {
  return async (ctx: Context) => {
    const {
      params: { lang },
    } = ctx;

    const app = await getApp({ context: ctx });

    if (!app) {
      throw notFound('App not found');
    }

    ctx.body = await getAppMessages({ app, language: lang, context: ctx });
    ctx.type = 'application/javascript';
  };
}
