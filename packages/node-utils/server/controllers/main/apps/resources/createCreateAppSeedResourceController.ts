import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import { type Context, type Middleware } from 'koa';

import { getResourceDefinition, processResourceBody } from '../../../../../resource.js';
import { type Options } from '../../../../types.js';

export function createCreateAppSeedResourceController(options: Options): Middleware {
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

    let createdResources;

    const preparedSeedAssets = structuredClone(preparedAssets);
    const preparedSeedResources: Record<string, unknown>[] = resources.map((resource) => {
      const cleanResource = { ...resource };
      if (app.demoMode) {
        for (const referencedProperty of Object.keys(resourceDefinition.references ?? {})) {
          delete cleanResource[referencedProperty];
        }
      }
      return {
        ...cleanResource,
        $seed: true,
        $ephemeral: false,
      };
    });

    for (const preparedSeedAsset of preparedSeedAssets) {
      const index = resources.findIndex(
        ({ $clonable: clonable, $ephemeral: ephemeral, $seed: seed, ...cleanResource }) => {
          const { $clonable, $ephemeral, $seed, ...cleanAssetResource } =
            preparedSeedAsset.resource;
          return isDeepStrictEqual(cleanResource, cleanAssetResource);
        },
      );
      const previousAssetId = preparedSeedAsset.id;
      const newAssetId = randomUUID();
      const updatedResource = JSON.parse(
        JSON.stringify(preparedSeedResources[index]).replace(previousAssetId, newAssetId),
      );
      preparedSeedAsset.id = newAssetId;
      preparedSeedAsset.resource = updatedResource;
      preparedSeedResources[index] = updatedResource;
    }

    createdResources = await createAppResourcesWithAssets({
      app,
      context: ctx,
      resources: preparedSeedResources,
      preparedAssets: preparedSeedAssets,
      resourceType,
      action,
      options,
    });

    if (app.demoMode) {
      createdResources = await createAppResourcesWithAssets({
        app,
        context: ctx,
        resources: resources.map((resource) => ({
          ...resource,
          $seed: false,
          $ephemeral: true,
          $clonable: false,
        })),
        preparedAssets,
        resourceType,
        action,
        options,
      });
    }

    ctx.body = Array.isArray(processedBody) ? createdResources : createdResources[0];
  };
}
