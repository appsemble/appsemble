import { type Context, type Middleware } from 'koa';

import { type Options } from '../../../../types.js';

export function createGetCurrentAppMemberController({
  getApp,
  getCurrentAppMember,
}: Options): Middleware {
  return async (ctx: Context) => {
    const { appId } = ctx.pathParams;
    const app = await getApp({
      context: ctx,
      query: { where: { id: appId }, attributes: ['id'] },
    });
    ctx.body = await getCurrentAppMember({ context: ctx, app });
  };
}
