import { AppPermission } from '@appsemble/utils';
import { type Context, type Middleware } from 'koa';

import { assertKoaError } from '../../../../../koa.js';
import { type Options } from '../../../../types.js';

export function createGetAppGroupsController({
  checkAuthSubjectAppPermissions,
  getApp,
  getAppGroups,
}: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
      user,
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaError(!app, ctx, 404, 'App not found');

    if (!app.demoMode) {
      assertKoaError(!user, ctx, 401);

      await checkAuthSubjectAppPermissions({
        app,
        context: ctx,
        permissions: [AppPermission.QueryGroups],
      });
    }

    ctx.body = await getAppGroups({ context: ctx, app });
  };
}
