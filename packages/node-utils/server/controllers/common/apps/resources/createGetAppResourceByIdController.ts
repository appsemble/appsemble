import { defaultLocale, remap } from '@appsemble/lang-sdk';
import {
  assertKoaCondition,
  type FindOptions,
  getRemapperContext,
  getResourceDefinition,
  type Options,
  setResourceEtagHeader,
} from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

import { appWideGroupId, getGroupIdWhere } from '../../../../utils/resources.js';

export function createGetAppResourceByIdController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceId, resourceType },
      queryParams: { selectedGroupId, view },
      user: authSubject,
    } = ctx;

    const { checkAppPermissions, getApp, getAppResource } = options;

    const app = await getApp({
      context: ctx,
      query: { attributes: ['demoMode', 'definition', 'id'], where: { id: appId } },
    });

    const findOptions: FindOptions = {
      where: {
        id: resourceId,
        type: resourceType,
        GroupId: getGroupIdWhere(selectedGroupId),
        expires: { or: [{ gt: new Date() }, null] },
        ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
      },
    };

    const resource = await getAppResource({
      app,
      id: resourceId,
      type: resourceType,
      context: ctx,
      findOptions,
    });

    assertKoaCondition(resource != null, ctx, 404, 'Resource not found');

    // The resource is searched across the selected groups; authorization is
    // then scoped to the group the resource actually belongs to.
    await checkAppPermissions({
      context: ctx,
      permissions: [
        resource.$author?.id === authSubject?.id
          ? `$resource:${resourceType}:own:get`
          : view
            ? `$resource:${resourceType}:get:${view}`
            : `$resource:${resourceType}:get`,
      ],
      app,
      groupId: resource.$group?.id ?? appWideGroupId,
    });

    if (view) {
      const context = await getRemapperContext(
        app,
        app.definition.defaultLanguage || defaultLocale,
        options,
        ctx,
      );

      const resourceDefinition = getResourceDefinition(app.definition, resourceType, ctx, view);

      // No ETag for view responses: the response body is a remapped projection
      // that does not uniquely identify the raw resource representation, so a
      // shared ETag across views would violate RFC 7232's representation-
      // identity requirement and confuse conditional GETs/caches.
      ctx.body = remap(resourceDefinition.views?.[view].remap ?? null, resource, context);
      return;
    }

    setResourceEtagHeader(ctx, resource);
    ctx.body = resource;
  };
}
