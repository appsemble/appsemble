import { type Context, type Middleware } from 'koa';

import { assertKoaError } from '../../koa.js';
import { type Options } from '../types.js';

export function createGetAppMember({ getApp, getAppMembers }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, memberId },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaError(!app, ctx, 404, 'App not found');
    assertKoaError(
      app.definition.security === undefined,
      ctx,
      404,
      'App does not have a security definition',
    );

    const appMembers = await getAppMembers({ context: ctx, app, memberId });

    assertKoaError(appMembers.length !== 1, ctx, 404, 'App member not found');

    ctx.body = appMembers[0];
  };
}
