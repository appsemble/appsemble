import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import {
  assertKoaError,
  type FindOptions,
  getRemapperContext,
  getResourceDefinition,
  logger,
  type Options,
  type OrderItem,
  processResourceBody,
  throwKoaError,
  type WhereOptions,
} from '@appsemble/node-utils';
import { type App, type ResourceDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import { type Context, type Middleware } from 'koa';

function generateQuery(
  ctx: Context,
  { parseQuery }: Options,
  resourceDefinition?: ResourceDefinition,
): { order: OrderItem[]; where: WhereOptions } {
  try {
    return parseQuery({
      $filter: ctx.queryParams.$filter,
      $orderby: ctx.queryParams.$orderby,
      resourceDefinition,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throwKoaError(ctx, 400, 'Unable to process this query', { syntaxError: error.message });
    }
    logger.error(error);
    throwKoaError(ctx, 400, 'Unable to process this query');
  }
}

export function createQueryResources(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceType },
      queryParams: { $select, $skip, $top },
      user,
    } = ctx;

    const { getApp, getAppResources, verifyResourceActionPermission } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const view = ctx.queryParams?.view;

    const resourceDefinition = getResourceDefinition(app, resourceType, ctx, view);

    const { order, where } = generateQuery(ctx, options, resourceDefinition);

    const memberQuery = await verifyResourceActionPermission({
      context: ctx,
      app,
      resourceType,
      action: 'query',
      options,
      ctx,
    });
    const isSameOrigin = ctx?.headers?.origin === ctx?.headers?.host;

    const findOptions: FindOptions = {
      limit: $top,
      offset: $skip,
      attributes: $select?.split(',').map((s) => s.trim()),
      where: {
        and: [
          where,
          {
            ...memberQuery,
            type: resourceType,
            AppId: appId,
            expires: { or: [{ gt: new Date() }, null] },
            ...(app.demoMode && !isSameOrigin ? { seed: false, ephemeral: true } : {}),
          },
        ],
      },
      order,
    };

    const resources = await getAppResources({
      app,
      findOptions,
      type: resourceType,
      context: ctx,
    });

    if (view) {
      const context = await getRemapperContext(
        app,
        app.definition.defaultLanguage || defaultLocale,
        user && {
          sub: user.id,
          name: user.name,
          email: user.primaryEmail,
          email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
          zoneinfo: user.timezone,
        },
        options,
        ctx,
      );

      ctx.body = resources.map((resource) =>
        remap(resourceDefinition.views[view].remap, resource, context),
      );
      return;
    }

    ctx.body = resources;
  };
}

export function createCountResources(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceType },
    } = ctx;

    const action = 'count';

    const { getApp, getAppResources, verifyResourceActionPermission } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const memberQuery = await verifyResourceActionPermission({
      app,
      context: ctx,
      action,
      resourceType,
      options,
      ctx,
    });

    const { where } = generateQuery(ctx, options);

    const findOptions: FindOptions = {
      where: {
        and: [
          where || {},
          {
            ...memberQuery,
            type: resourceType,
            AppId: appId,
            expires: { or: [{ gt: new Date() }, null] },
            ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
          },
        ],
      },
    };

    const resources = await getAppResources({
      app,
      findOptions,
      type: resourceType,
      context: ctx,
    });

    ctx.body = resources.length;
  };
}

export function createGetResourceById(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceId, resourceType },
      user,
    } = ctx;

    const action = 'get';

    const { getApp, getAppResource, verifyResourceActionPermission } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const view = ctx.queryParams?.view;

    const resourceDefinition = getResourceDefinition(app, resourceType, ctx, view);

    const memberQuery = await verifyResourceActionPermission({
      app,
      context: ctx,
      action,
      resourceType,
      options,
      ctx,
    });

    const findOptions: FindOptions = {
      where: {
        ...memberQuery,
        id: resourceId,
        type: resourceType,
        AppId: appId,
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
        user && {
          sub: user.id,
          name: user.name,
          email: user.primaryEmail,
          email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
          zoneinfo: user.timezone,
        },
        options,
        ctx,
      );

      ctx.body = remap(resourceDefinition.views[view].remap, resource, context);
      return;
    }

    ctx.body = resource;
  };
}

export function createCreateResource(options: Options): Middleware {
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

export function createUpdateResource(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceId, resourceType },
    } = ctx;

    const {
      getApp,
      getAppAssets,
      getAppResource,
      updateAppResource,
      verifyResourceActionPermission,
    } = options;
    const action = 'update';

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const resourceDefinition = getResourceDefinition(app, resourceType, ctx);

    const memberQuery = await verifyResourceActionPermission({
      app,
      context: ctx,
      action,
      resourceType,
      options,
      ctx,
    });

    const findOptions: FindOptions = {
      where: {
        ...memberQuery,
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

export function createDeleteResource(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, resourceId, resourceType },
    } = ctx;

    const { deleteAppResource, getApp, getAppResource, verifyResourceActionPermission } = options;
    const action = 'delete';

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const memberQuery = await verifyResourceActionPermission({
      app,
      context: ctx,
      action,
      resourceType,
      options,
      ctx,
    });

    const findOptions: FindOptions = {
      where: {
        ...memberQuery,
        id: resourceId,
        type: resourceType,
        AppId: appId,
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

export function createSeedResource(options: Options): Middleware {
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

async function deleteResourcesRecursively(
  type: string,
  app: App,
  options: Options,
  context: Context,
): Promise<void> {
  const { deleteAppResource, getAppResources } = options;

  const referencingResources = Object.entries(app.definition.resources).filter(
    ([, resourceDefinition]) =>
      Object.values(resourceDefinition.references ?? {}).find(
        (resourceReference) => resourceReference.resource === type,
      ),
  );

  for (const [referencingResourceType] of referencingResources) {
    await deleteResourcesRecursively(referencingResourceType, app, options, context);
  }

  const resourcesToDeleteFindOptions: FindOptions = {
    where: {
      type,
      AppId: app.id,
      or: [{ seed: true }, { ephemeral: true }],
    },
  };

  const resourcesToDelete = await getAppResources({
    app,
    findOptions: resourcesToDeleteFindOptions,
    type,
    context,
  });

  for (const resourceToDelete of resourcesToDelete) {
    await deleteAppResource({
      app,
      context,
      options,
      id: resourceToDelete.id,
      type,
    });
  }
}

export function createDeleteSeedResources(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
    } = ctx;

    const { getApp } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaError(!app, ctx, 404, 'App not found');

    for (const resourceType of Object.keys(app.definition.resources ?? {})) {
      await deleteResourcesRecursively(resourceType, app, options, ctx);
    }
  };
}
