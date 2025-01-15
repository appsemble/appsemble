import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import { type Context, type Middleware } from 'koa';

import {
  type AssetToUpload,
  getResourceDefinition,
  type Options,
  processResourceBody,
  uploadAssets,
} from '../../../../../index.js';

/**
 * Create a controller for resource creation.
 *
 * The created controller handles resource creation of one or more resources,
 * extracted from the request body.
 *
 * The controller can be used to seed resources into an app when the endpoint is
 * called from the CLI with the `seed` parameter equal to `true`.
 *
 * @param options The options object to use for resource creation
 * @returns A middleware function that handles resource creation.
 */
export function createCreateAppResourceController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceType },
      query,
      queryParams: { selectedGroupId },
    } = ctx;
    const { checkAppPermissions, createAppResourcesWithAssets, getApp, getAppAssets } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    await checkAppPermissions({
      context: ctx,
      permissions: [`$resource:${resourceType}:create`],
      app,
      groupId: selectedGroupId,
    });

    const resourceDefinition = getResourceDefinition(app.definition, resourceType, ctx);

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

    const assetsToUpload: AssetToUpload[] = [];
    if (!(ctx.client && 'app' in ctx.client) && query?.seed === 'true') {
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
          ({ $clonable: clonable, $ephemeral: ephemeral, $seed: unused, ...cleanResource }) => {
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

      const createdSeedResources = await createAppResourcesWithAssets({
        app,
        groupId: selectedGroupId,
        context: ctx,
        resources: preparedSeedResources,
        preparedAssets: preparedSeedAssets,
        resourceType,
        options,
      });

      if (!app.demoMode) {
        ctx.body = Array.isArray(processedBody) ? createdSeedResources : createdSeedResources[0];
        await uploadAssets(app.id, preparedSeedAssets);
        return;
      }

      assetsToUpload.push(...preparedSeedAssets);
    }

    const createdResources = await createAppResourcesWithAssets({
      app,
      groupId: selectedGroupId,
      context: ctx,
      resources: resources.map((resource) => ({
        ...resource,
        $seed: false,
        $ephemeral: app.demoMode,
        ...(app.demoMode ? { $clonable: false } : {}),
      })),
      preparedAssets,
      resourceType,
      options,
    });

    assetsToUpload.push(...preparedAssets);
    await uploadAssets(app.id, assetsToUpload);

    ctx.body = Array.isArray(processedBody) ? createdResources : createdResources[0];
  };
}
