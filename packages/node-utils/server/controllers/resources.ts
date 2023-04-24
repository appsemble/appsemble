import { getResourceDefinition, processResourceBody } from '@appsemble/node-utils/resource.js';
import { defaultLocale, remap } from '@appsemble/utils';
import { badRequest, internal, notFound } from '@hapi/boom';
import { Context, Middleware } from 'koa';

import { getRemapperContext } from '../../app.js';
import { logger } from '../../logger.js';
import { FindOptions, Options } from '../types.js';

function generateQuery(
  ctx: Context,
  { parseQuery }: Options,
): { order: Pick<FindOptions, 'order'>; where: Pick<FindOptions, 'where'> } {
  try {
    return parseQuery({ $filter: ctx.queryParams.$filter, $orderby: ctx.queryParams.$orderby });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw badRequest('Unable to process this query', { syntaxError: error.message });
    }
    logger.error(error);
    throw internal('Unable to process this query');
  }
}

export function createQueryResources(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { resourceType },
      queryParams: { $select, $skip, $top, view },
      user,
    } = ctx;

    const { getApp, getAppMessages, getAppResources, getAppUrl, verifyPermission } = options;

    const app = await getApp({ context: ctx, user });

    const { order, where } = generateQuery(ctx, options);

    const userQuery = await verifyPermission({
      context: ctx,
      app,
      resourceType,
      action: 'query',
      options,
    });

    const findOptions: FindOptions = {
      limit: $top,
      offset: $skip,
      attributes: $select?.split(',').map((s) => s.trim()),
      where: {
        and: [
          where,
          {
            ...userQuery,
            type: resourceType,
            AppId: app.id,
            expires: { or: [{ gt: new Date() }, null] },
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

    const resourceDefinition = getResourceDefinition(app, resourceType, view);

    if (view) {
      const appUrl = String(await getAppUrl({ app, context: ctx }));

      const defaultLanguage = app.definition.defaultLanguage || defaultLocale;
      const appMessages = await getAppMessages({
        app,
        context: ctx,
        baseLang: defaultLanguage,
      });

      const context = getRemapperContext(
        app,
        appUrl,
        appMessages,
        defaultLanguage,
        user && {
          sub: user.id,
          name: user.name,
          email: user.primaryEmail,
          email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
          zoneinfo: user.timezone,
        },
      );

      ctx.body = resources.map((resource) =>
        remap(resourceDefinition.views[view].remap, resource, context),
      );
      return;
    }

    ctx.body = resources;
  };
}

export function createCountResources(options: Options) {
  return async (ctx: Context) => {
    const {
      pathParams: { resourceType },
    } = ctx;

    const action = 'count';

    const { getApp, getAppResources, verifyPermission } = options;

    const app = await getApp({ context: ctx });

    await verifyPermission({ app, context: ctx, action, resourceType, options });

    const { where } = generateQuery(ctx, options);

    const resources = await getAppResources({
      app,
      findOptions: {
        where,
      },
      type: resourceType,
      context: ctx,
    });

    ctx.body = resources.length;
  };
}

export function createGetResourceById({
  getApp,
  getAppMessages,
  getAppResource,
  getAppUrl,
}: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { resourceId, resourceType },
      queryParams: { view },
      user,
    } = ctx;

    const app = await getApp({ context: ctx });

    const resourceDefinition = getResourceDefinition(app, resourceType, view);

    const resource = await getAppResource({
      app,
      id: resourceId,
      type: resourceType,
      context: ctx,
    });

    if (!resource) {
      throw notFound('Resource not found');
    }

    if (view) {
      const appUrl = String(await getAppUrl({ app, context: ctx }));

      const defaultLanguage = app.definition.defaultLanguage || defaultLocale;
      const appMessages = await getAppMessages({
        app,
        context: ctx,
        baseLang: defaultLanguage,
      });

      const context = getRemapperContext(
        app,
        appUrl,
        appMessages,
        defaultLanguage,
        user && {
          sub: user.id,
          name: user.name,
          email: user.primaryEmail,
          email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
          zoneinfo: user.timezone,
        },
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
      pathParams: { resourceType },
    } = ctx;
    const { createAppResourcesWithAssets, getApp, verifyPermission } = options;
    const action = 'create';

    const app = await getApp({ context: ctx });

    const resourceDefinition = getResourceDefinition(app, resourceType);
    await verifyPermission({ app, context: ctx, action, resourceType, options });

    const [processedBody, preparedAssets] = processResourceBody(ctx, resourceDefinition);
    if (Array.isArray(processedBody) && !processedBody.length) {
      ctx.body = [];
      return;
    }

    const resources = Array.isArray(processedBody) ? processedBody : [processedBody];
    const createdResources = await createAppResourcesWithAssets({
      app,
      context: ctx,
      resources,
      preparedAssets,
      resourceType,
      action,
    });

    ctx.body = Array.isArray(processedBody) ? createdResources : createdResources[0];
  };
}

export function createUpdateResource(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { resourceId, resourceType },
    } = ctx;

    const {
      deleteAppResource,
      getApp,
      getAppAssets,
      getAppResource,
      updateAppResource,
      verifyPermission,
    } = options;
    const action = 'update';

    const app = await getApp({ context: ctx });

    const resourceDefinition = getResourceDefinition(app, resourceType);
    const whereOptions = await verifyPermission({
      app,
      context: ctx,
      action,
      resourceType,
      options,
    });

    const oldResource = await getAppResource({
      app,
      id: resourceId,
      type: resourceType,
      context: ctx,
      whereOptions,
    });

    if (!oldResource) {
      throw notFound('Resource not found');
    }

    const appAssets = await getAppAssets({ context: ctx, app });

    const [processedBody, preparedAssets, deletedAssetIds] = processResourceBody(
      ctx,
      resourceDefinition,
      appAssets.filter((asset) => asset.resourceId === resourceId).map((asset) => asset.id),
      oldResource.expires as Date,
    );

    const resources = Array.isArray(processedBody) ? processedBody : [processedBody];

    await updateAppResource({
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

    await deleteAppResource({
      app,
      context: ctx,
      id: resourceId,
      type: resourceType,
      action: 'delete',
    });

    ctx.status = 204;
  };
}

export function createDeleteResource(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { resourceId, resourceType },
    } = ctx;

    const { deleteAppResource, getApp, getAppResource, verifyPermission } = options;
    const action = 'delete';

    const app = await getApp({ context: ctx });

    const whereOptions = await verifyPermission({
      app,
      context: ctx,
      action,
      resourceType,
      options,
    });

    const resource = await getAppResource({
      app,
      id: resourceId,
      type: resourceType,
      context: ctx,
      whereOptions,
    });

    if (!resource) {
      throw notFound('Resource not found');
    }

    await deleteAppResource({ app, context: ctx, id: resourceId, type: resourceType, action });

    ctx.status = 204;
  };
}
