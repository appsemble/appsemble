import {
  assertKoaCondition,
  type FindOptions,
  getResourceDefinition,
  type Options,
  processResourceBody,
} from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createUpdateAppResourceController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceId, resourceType },
      queryParams: { selectedGroupId },
      user: authSubject,
    } = ctx;

    const { checkAppPermissions, getApp, getAppAssets, getAppResource, updateAppResource } =
      options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const findOptions: FindOptions = {
      where: {
        id: resourceId,
        type: resourceType,
        AppId: appId,
        GroupId: selectedGroupId ?? null,
        expires: { or: [{ gt: new Date() }, null] },
        ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
      },
    };

    const oldResource = await getAppResource({
      app,
      id: resourceId,
      type: resourceType,
      context: ctx,
      findOptions,
    });

    assertKoaCondition(oldResource != null, ctx, 404, 'Resource not found');

    await checkAppPermissions({
      context: ctx,
      permissions: [
        oldResource.$author?.id === authSubject?.id
          ? `$resource:${resourceType}:own:update`
          : `$resource:${resourceType}:update`,
      ],
      app,
      groupId: selectedGroupId,
    });

    const appAssets = await getAppAssets({ context: ctx, app });

    const resourceDefinition = getResourceDefinition(app.definition, resourceType, ctx);

    const [processedBody, preparedAssets, deletedAssetIds] = processResourceBody(
      ctx,
      resourceDefinition,
      appAssets.filter((asset) => asset.resourceId === resourceId).map((asset) => asset.id),
      oldResource.expires as Date,
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      appAssets.map((asset) => ({ id: asset.id, name: asset.name })),
    );

    const resources = Array.isArray(processedBody) ? processedBody : [processedBody];

    ctx.body = await updateAppResource({
      app,
      context: ctx,
      id: resourceId,
      type: resourceType,
      resource: resources[0],
      preparedAssets,
      deletedAssetIds,
      resourceDefinition,
      options,
    });
  };
}
