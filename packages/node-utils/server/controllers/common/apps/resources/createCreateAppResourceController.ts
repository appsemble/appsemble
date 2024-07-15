import { type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

import { getResourceDefinition, processResourceBody } from '../../../../../resource.js';

export function createCreateAppResourceController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceType },
    } = ctx;
    const { createAppResourcesWithAssets, getApp, getAppAssets, verifyResourceActionPermission } =
      options;
    const action = 'create';

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const resourceDefinition = getResourceDefinition(app, resourceType, ctx);
    await verifyResourceActionPermission({ app, context: ctx, action, resourceType, options, ctx });

    const appAssets = await getAppAssets({ app, context: ctx });

    const [processedBody, preparedAssets] = processResourceBody(
      ctx,
      resourceDefinition,
      undefined,
      undefined,
      appAssets.map((appAsset) => ({ id: appAsset.id, name: appAsset.name })),
    );

    if (Array.isArray(processedBody) && !processedBody.length) {
      ctx.body = [];
      return;
    }

    const resources = Array.isArray(processedBody) ? processedBody : [processedBody];

    const createdResources = await createAppResourcesWithAssets({
      app,
      context: ctx,
      resources: resources.map((resource) => ({
        ...resource,
        $seed: false,
        $ephemeral: app.demoMode,
      })),
      preparedAssets,
      resourceType,
      action,
      options,
    });

    ctx.body = Array.isArray(processedBody) ? createdResources : createdResources[0];
  };
}
