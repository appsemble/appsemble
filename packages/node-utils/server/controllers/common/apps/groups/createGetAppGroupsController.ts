import { type Context, type Middleware } from 'koa';

import { assertKoaError } from '../../../../../koa.js';
import { type Options } from '../../../../types.js';

export function createGetAppGroupsController({ getApp, getAppGroups }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
      user,
    } = ctx;

    // TODO check AppPermission.QueryGroups
    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaError(!app, ctx, 404, 'App not found');

    ctx.body = await getAppGroups({ context: ctx, app, id: user.id });
  };
}
