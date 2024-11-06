import { type Context, type Middleware } from 'koa';

import { type Options } from '../../../../../types.js';

export function createGetCurrentAppMemberGroupsController({
  getApp,
  getCurrentAppMemberGroups,
}: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
    } = ctx;
    const app = await getApp({ context: ctx, query: { where: { id: appId }, attributes: ['id'] } });
    ctx.body = await getCurrentAppMemberGroups({ context: ctx, app });
  };
}
