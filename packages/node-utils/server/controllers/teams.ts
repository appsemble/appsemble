import { notFound } from '@hapi/boom';
import { type Context, type Middleware } from 'koa';

import { type Options } from '../types.js';

export function createGetTeams({ getApp, getAppTeams }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
      user,
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    if (!app) {
      throw notFound('App not found');
    }

    ctx.body = await getAppTeams({ context: ctx, app, user });
  };
}
