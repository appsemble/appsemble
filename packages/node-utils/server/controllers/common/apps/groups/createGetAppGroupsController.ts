import { AppPermission } from '@appsemble/types';
import { type Context, type Middleware } from 'koa';

import { assertKoaCondition } from '../../../../../koa.js';
import { type Options } from '../../../../types.js';

export function createGetAppGroupsController({
  checkAuthSubjectAppPermissions,
  getApp,
  getAppGroups,
}: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaCondition(!!app, ctx, 404, 'App not found');

    await checkAuthSubjectAppPermissions({
      app,
      context: ctx,
      permissions: [AppPermission.QueryGroups],
    });

    ctx.body = await getAppGroups({ context: ctx, app });
  };
}
