import { assertKoaCondition, type FindOptions, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createDeleteAppResourceController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceId, resourceType },
      queryParams: { selectedGroupId },
      user: authSubject,
    } = ctx;

    const { checkAppPermissions, deleteAppResource, getApp, getAppResource } = options;

    const app = await getApp({
      context: ctx,
      query: { attributes: ['demoMode', 'id'], where: { id: appId } },
    });

    const findOptions: FindOptions = {
      where: {
        id: resourceId,
        type: resourceType,
        AppId: appId,
        GroupId: selectedGroupId ?? null,
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

    assertKoaCondition(resource != null, ctx, 404, 'Resource not found');

    await checkAppPermissions({
      context: ctx,
      permissions: [
        resource.$author?.id === authSubject!.id
          ? `$resource:${resourceType}:own:delete`
          : `$resource:${resourceType}:delete`,
      ],
      app,
      groupId: selectedGroupId,
    });

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
