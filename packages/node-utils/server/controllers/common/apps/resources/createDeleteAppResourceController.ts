import { assertKoaError, type FindOptions, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createDeleteAppResourceController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceId, resourceType },
      queryParams: { groupId },
    } = ctx;

    const { checkAppPermissions, deleteAppResource, getApp, getAppResource } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    await checkAppPermissions({
      context: ctx,
      permissions: [`$resource:${resourceType}:delete`],
      app,
      groupId,
    });

    const findOptions: FindOptions = {
      where: {
        id: resourceId,
        type: resourceType,
        AppId: appId,
        GroupId: groupId ?? null,
        expires: { or: [{ gt: new Date() }, { eq: null }] },
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

    await deleteAppResource({
      app,
      context: ctx,
      id: resourceId,
      type: resourceType,
      options,
    });

    ctx.status = 204;
  };
}
