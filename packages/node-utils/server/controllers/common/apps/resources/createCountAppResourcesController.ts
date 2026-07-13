import { type CustomAppPermission } from '@appsemble/lang-sdk';
import { type FindOptions, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

import { generateResourceQuery, getGroupIdWhere } from '../../../../utils/resources.js';

export function createCountAppResourcesController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceType },
      queryParams: { $own, selectedGroupId },
      user: authSubject,
    } = ctx;

    const { checkAppPermissions, getAllowedGroups, getApp, getAppResources } = options;

    const app = await getApp({
      context: ctx,
      query: { where: { id: appId }, attributes: ['demoMode', 'id'] },
    });

    const permissions: CustomAppPermission[] = [
      $own ? `$resource:${resourceType}:own:query` : `$resource:${resourceType}:query`,
    ];

    // Across multiple selected groups the permission acts as a filter: only the
    // groups the subject may query are counted. When no selected group is
    // queryable, the strict permission check throws its usual 403.
    const allowedGroups = await getAllowedGroups({
      context: ctx,
      permissions,
      app,
      groupId: selectedGroupId,
    });

    if (!allowedGroups.length) {
      await checkAppPermissions({ context: ctx, permissions, app, groupId: selectedGroupId });
    }

    const { where } = generateResourceQuery(ctx, options);

    const findOptions: FindOptions = {
      attributes: ['id'],
      where: {
        and: [
          where || {},
          {
            type: resourceType,
            GroupId: getGroupIdWhere(allowedGroups.length ? allowedGroups : selectedGroupId),
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
