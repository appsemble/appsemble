import {
  type FindOptions,
  getRemapperContext,
  getResourceDefinition,
  logger,
  type Options,
  type OrderItem,
  processResourceBody,
  type WhereOptions,
} from '@appsemble/node-utils';
import { defaultLocale, remap } from '@appsemble/utils';
import { badRequest, internal, notFound } from '@hapi/boom';
import { type Context, type Middleware } from 'koa';

function generateQuery(
  ctx: Context,
  { parseQuery }: Options,
): { order: OrderItem[]; where: WhereOptions } {
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
      pathParams: { appId, resourceType },
      queryParams: { $select, $skip, $top },
      user,
    } = ctx;

    const { getApp, getAppResources, verifyResourceActionPermission } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const { order, where } = generateQuery(ctx, options);

    const userQuery = await verifyResourceActionPermission({
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
            AppId: appId,
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

    const view = ctx.queryParams?.view;

    const resourceDefinition = getResourceDefinition(app, resourceType, view);

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

    const userQuery = await verifyResourceActionPermission({
      app,
      context: ctx,
      action,
      resourceType,
      options,
    });

    const { where } = generateQuery(ctx, options);

    const findOptions: FindOptions = {
      where: {
        and: [
          where || {},
          {
            ...userQuery,
            type: resourceType,
            AppId: appId,
            expires: { or: [{ gt: new Date() }, null] },
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

    const resourceDefinition = getResourceDefinition(app, resourceType, view);

    const userQuery = await verifyResourceActionPermission({
      app,
      context: ctx,
      action,
      resourceType,
      options,
    });

    const findOptions: FindOptions = {
      where: {
        ...userQuery,
        id: resourceId,
        type: resourceType,
        AppId: appId,
        expires: { or: [{ gt: new Date() }, null] },
      },
    };

    const resource = await getAppResource({
      app,
      id: resourceId,
      type: resourceType,
      context: ctx,
      findOptions,
    });

    if (!resource) {
      throw notFound('Resource not found');
    }

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
    const { createAppResourcesWithAssets, getApp, verifyResourceActionPermission } = options;
    const action = 'create';

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    const resourceDefinition = getResourceDefinition(app, resourceType);
    await verifyResourceActionPermission({ app, context: ctx, action, resourceType, options });

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

    const resourceDefinition = getResourceDefinition(app, resourceType);

    const userQuery = await verifyResourceActionPermission({
      app,
      context: ctx,
      action,
      resourceType,
      options,
    });

    const findOptions: FindOptions = {
      where: {
        ...userQuery,
        id: resourceId,
        type: resourceType,
        AppId: appId,
        expires: { or: [{ gt: new Date() }, null] },
      },
    };

    const oldResource = await getAppResource({
      app,
      id: resourceId,
      type: resourceType,
      context: ctx,
      findOptions,
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

    const userQuery = await verifyResourceActionPermission({
      app,
      context: ctx,
      action,
      resourceType,
      options,
    });

    const findOptions: FindOptions = {
      where: {
        ...userQuery,
        id: resourceId,
        type: resourceType,
        AppId: appId,
        expires: { or: [{ gt: new Date() }, null] },
      },
    };

    const resource = await getAppResource({
      app,
      id: resourceId,
      type: resourceType,
      context: ctx,
      findOptions,
    });

    if (!resource) {
      throw notFound('Resource not found');
    }

    await deleteAppResource({
      app,
      context: ctx,
      id: resourceId,
      type: resourceType,
      action,
      options,
    });

    ctx.status = 204;
  };
}
