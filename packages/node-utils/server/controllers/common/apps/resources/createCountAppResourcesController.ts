import { type FindOptions, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

import { generateResourceQuery } from '../../../../utils/resources.js';

export function createCountAppResourcesController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceType },
      queryParams: { groupId },
    } = ctx;

    const { checkAppPermissions, getApp, getAppResources } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    await checkAppPermissions({
      context: ctx,
      permissions: [`$resource:${resourceType}:query`],
      app,
      groupId,
    });

    const { where } = generateResourceQuery(ctx, options);

    const findOptions: FindOptions = {
      where: {
        and: [
          where || {},
          {
            type: resourceType,
            AppId: appId,
            GroupId: groupId ?? null,
            expires: { or: [{ gt: new Date() }, null] },
            ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
          },
        ],
      },
    };

    const resources = await getAppResources({
      app,
      findOptions,
      type: resourceType,
      context: ctx,
    });

    ctx.body = resources.length;
  };
}
