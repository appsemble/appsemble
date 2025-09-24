import { type FindOptions, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

import { generateResourceQuery } from '../../../../utils/resources.js';

export function createCountAppResourcesController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceType },
      queryParams: { $own, selectedGroupId },
      user: authSubject,
    } = ctx;

    const { checkAppPermissions, getApp, getAppResources } = options;

    const app = await getApp({
      context: ctx,
      query: { where: { id: appId }, attributes: ['demoMode', 'id'] },
    });

    await checkAppPermissions({
      context: ctx,
      permissions: [
        $own ? `$resource:${resourceType}:own:query` : `$resource:${resourceType}:query`,
      ],
      app,
      groupId: selectedGroupId,
    });

    const { where } = generateResourceQuery(ctx, options);

    const findOptions: FindOptions = {
      attributes: ['id'],
      where: {
        and: [
          where || {},
          {
            type: resourceType,
            GroupId: selectedGroupId ?? null,
            expires: { or: [{ gt: new Date() }, null] },
            ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
            ...($own ? { AuthorId: authSubject?.id } : {}),
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
