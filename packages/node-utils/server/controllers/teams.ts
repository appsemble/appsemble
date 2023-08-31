import { type Context, type Middleware } from 'koa';

import { assertKoaError } from '../../koa.js';
import { type Options } from '../types.js';

export function createGetTeams({ getApp, getAppTeams }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
      user,
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaError(!app, ctx, 404, 'App not found');

    ctx.body = await getAppTeams({ context: ctx, app, user });
  };
}
