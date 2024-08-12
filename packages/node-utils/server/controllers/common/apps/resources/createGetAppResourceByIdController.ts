import {
  assertKoaError,
  type FindOptions,
  getRemapperContext,
  getResourceDefinition,
  type Options,
} from '@appsemble/node-utils';
import { defaultLocale, remap } from '@appsemble/utils';
import { type Context, type Middleware } from 'koa';

export function createGetAppResourceByIdController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceId, resourceType },
      queryParams: { groupId },
    } = ctx;

    const { checkAppPermissions, getApp, getAppResource } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const view = ctx.queryParams?.view;

    const resourceDefinition = getResourceDefinition(app.definition, resourceType, ctx, view);

    await checkAppPermissions({
      context: ctx,
      permissions: [`$resource:${resourceType}:get`],
      app,
      groupId,
    });

    const findOptions: FindOptions = {
      where: {
        id: resourceId,
        type: resourceType,
        AppId: appId,
        GroupId: groupId ?? null,
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

    assertKoaError(!resource, ctx, 404, 'Resource not found');

    if (view) {
      const context = await getRemapperContext(
        app,
        app.definition.defaultLanguage || defaultLocale,
        options,
        ctx,
      );

      ctx.body = remap(resourceDefinition.views[view].remap, resource, context);
      return;
    }

    ctx.body = resource;
  };
}
