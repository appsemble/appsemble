import {
  type FindOptions,
  getRemapperContext,
  getResourceDefinition,
  type Options,
} from '@appsemble/node-utils';
import { defaultLocale, remap } from '@appsemble/utils';
import { type Context, type Middleware } from 'koa';

import { generateResourceQuery } from '../../../../utils/resources.js';

export function createQueryAppResourcesController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceType },
      queryParams: { $select, $skip, $top, groupId },
    } = ctx;

    const { checkAuthSubjectAppPermissions, getApp, getAppResources } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const view = ctx.queryParams?.view;

    const resourceDefinition = getResourceDefinition(app, resourceType, ctx, view);

    const { order, where } = generateResourceQuery(ctx, options, resourceDefinition);

    await checkAuthSubjectAppPermissions({
      context: ctx,
      permissions: [`$resource:${resourceType}:query`],
      app,
      groupId,
    });

    const isSameOrigin = ctx?.headers?.origin === ctx?.headers?.host;

    const findOptions: FindOptions = {
      limit: $top,
      offset: $skip,
      attributes: $select?.split(',').map((s) => s.trim()),
      where: {
        and: [
          where,
          {
            type: resourceType,
            AppId: appId,
            GroupId: groupId ?? null,
            expires: { or: [{ gt: new Date() }, null] },
            ...(app.demoMode && !isSameOrigin ? { seed: false, ephemeral: true } : {}),
          },
        ],
      },
      order,
    };

    const resources = await getAppResources({
      app,
      findOptions,
      type: resourceType,
      context: ctx,
    });

    if (view) {
      const context = await getRemapperContext(
        app,
        app.definition.defaultLanguage || defaultLocale,
        options,
        ctx,
      );

      ctx.body = resources.map((resource) =>
        remap(resourceDefinition.views[view].remap, resource, context),
      );
      return;
    }

    ctx.body = resources;
  };
}
