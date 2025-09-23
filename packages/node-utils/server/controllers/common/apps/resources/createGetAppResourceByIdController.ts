import { defaultLocale, remap } from '@appsemble/lang-sdk';
import {
  assertKoaCondition,
  type FindOptions,
  getRemapperContext,
  getResourceDefinition,
  type Options,
} from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

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
        GroupId: selectedGroupId ?? null,
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
      groupId: selectedGroupId,
    });

    if (view) {
      const context = await getRemapperContext(
        app,
        app.definition.defaultLanguage || defaultLocale,
        options,
        ctx,
      );

      const resourceDefinition = getResourceDefinition(app.definition, resourceType, ctx, view);

      ctx.body = remap(resourceDefinition.views?.[view].remap ?? null, resource, context);
      return;
    }

    ctx.body = resource;
  };
}
