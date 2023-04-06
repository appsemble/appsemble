import { FindOptions } from '@appsemble/cli/server/db/types.js';
import { getResourceDefinition, processResourceBody } from '@appsemble/node-utils/resource.js';
import { defaultLocale, remap } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import { Context, Middleware } from 'koa';

import { getRemapperContext } from '../../app.js';
import { Options } from '../types.js';

export function createQueryResources({
  getApp,
  getAppMessages,
  getAppResources,
  getAppUrl,
}: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { resourceType },
      queryParams: { $select, $skip, $top, view },
      user,
    } = ctx;

    const app = await getApp({ context: ctx });

    const findOptions: FindOptions = {
      limit: $top,
      offset: $skip,
      attributes: $select?.split(',').map((s) => s.trim()),
    };

    const resources = await getAppResources({
      app,
      query: findOptions,
      type: resourceType,
      context: ctx,
    });

    const resourceDefinition = getResourceDefinition(app, resourceType, view);

    if (view) {
      const appUrl = String(await getAppUrl({ app, context: ctx }));
      const appMessages = await getAppMessages({ app, context: ctx });
      const defaultLanguage = app.definition.defaultLanguage || defaultLocale;

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
      const appMessages = await getAppMessages({ app, context: ctx });
      const defaultLanguage = app.definition.defaultLanguage || defaultLocale;

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
    const { createResourcesWithAssets, getApp, verifyPermission } = options;
    const action = 'create';

    const app = await getApp({ context: ctx });

    const resourceDefinition = getResourceDefinition(app, resourceType);
    await verifyPermission({ app, context: ctx, action, resourceType });

    const [resource, preparedAssets] = processResourceBody(ctx, resourceDefinition);
    if (Array.isArray(resource) && !resource.length) {
      ctx.body = [];
      return;
    }

    const resources = Array.isArray(resource) ? resource : [resource];
    const createdResources = await createResourcesWithAssets({
      app,
      resources,
      preparedAssets,
      resourceType,
    });

    console.log(createdResources)

    ctx.body = Array.isArray(resource) ? createdResources : createdResources[0];
  };
}
