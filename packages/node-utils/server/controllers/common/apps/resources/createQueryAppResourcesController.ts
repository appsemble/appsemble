import { defaultLocale, remap } from '@appsemble/lang-sdk';
import {
  type FindOptions,
  getRemapperContext,
  getResourceDefinition,
  type Options,
} from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

import { generateResourceQuery } from '../../../../utils/resources.js';

export function createQueryAppResourcesController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceType },
      queryParams: { $own, $select, $skip, $top, selectedGroupId, view },
      user: authSubject,
    } = ctx;

    const { checkAppPermissions, getApp, getAppResources } = options;

    const app = await getApp({
      context: ctx,
      query: { attributes: ['definition', 'demoMode', 'id'], where: { id: appId } },
    });

    const resourceDefinition = getResourceDefinition(app.definition, resourceType, ctx, view);

    const { order, where } = generateResourceQuery(ctx, options, resourceDefinition);

    await checkAppPermissions({
      context: ctx,
      permissions: [
        $own
          ? `$resource:${resourceType}:own:query`
          : view
            ? `$resource:${resourceType}:query:${view}`
            : `$resource:${resourceType}:query`,
      ],
      app,
      groupId: selectedGroupId,
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
            GroupId: selectedGroupId ?? null,
            expires: { or: [{ gt: new Date() }, null] },
            ...(app.demoMode && !isSameOrigin ? { seed: false, ephemeral: true } : {}),
            ...($own ? { AuthorId: authSubject?.id } : {}),
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
        remap(resourceDefinition.views?.[view].remap ?? null, resource, context),
      );
      return;
    }

    ctx.body = resources;
  };
}
