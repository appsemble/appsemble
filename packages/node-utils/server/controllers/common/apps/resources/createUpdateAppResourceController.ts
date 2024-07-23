import {
  assertKoaError,
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
    } = ctx;

    const {
      checkAuthSubjectAppPermissions,
      getApp,
      getAppAssets,
      getAppResource,
      updateAppResource,
    } = options;
    const action = 'update';

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const resourceDefinition = getResourceDefinition(app, resourceType, ctx);

    await checkAuthSubjectAppPermissions({
      context: ctx,
      app,
      permissions: [`$resource:${resourceType}:update`],
    });

    const findOptions: FindOptions = {
      where: {
        id: resourceId,
        type: resourceType,
        AppId: appId,
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

    assertKoaError(!oldResource, ctx, 404, 'Resource not found');

    const appAssets = await getAppAssets({ context: ctx, app });

    const [processedBody, preparedAssets, deletedAssetIds] = processResourceBody(
      ctx,
      resourceDefinition,
      appAssets.filter((asset) => asset.resourceId === resourceId).map((asset) => asset.id),
      oldResource.expires as Date,
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
      action,
      options,
    });
  };
}
