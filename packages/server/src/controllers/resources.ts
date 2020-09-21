import { checkAppRole, Permission, SchemaValidationError, validate } from '@appsemble/utils';
import { badRequest, forbidden, notFound, unauthorized } from '@hapi/boom';
import { addMilliseconds, isPast, parseISO } from 'date-fns';
import type { OpenAPIV3 } from 'openapi-types';
import parseDuration from 'parse-duration';
import { Op, Order, WhereOptions } from 'sequelize';

import {
  App,
  AppSubscription,
  Organization,
  Resource,
  ResourceSubscription,
  User,
} from '../models';
import type { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';
import { odataFilterToSequelize, odataOrderbyToSequelize } from '../utils/odata';
import { processHooks, processReferenceHooks, renameOData } from '../utils/resource';

interface Params {
  appId: number;
  resourceType: string;
  resourceId: number;
  $filter: string;
  $orderby: string;
  $top: number;
}

function verifyResourceDefinition(app: App, resourceType: string): OpenAPIV3.SchemaObject {
  if (!app) {
    throw notFound('App not found');
  }

  if (!app.definition.resources) {
    throw notFound('App does not have any resources defined');
  }

  if (!app.definition.resources[resourceType]) {
    throw notFound(`App does not have resources called ${resourceType}`);
  }

  if (!app.definition.resources[resourceType].schema) {
    throw notFound(`App does not have a schema for resources called ${resourceType}`);
  }

  return app.definition.resources[resourceType].schema;
}

/**
 * Verifies whether or not the user has sufficient permissions to perform a resource call.
 * Will throw an 403 error if the user does not satisfy the requirements.
 *
 * @param ctx - Koa context of the request
 * @param app - App as fetched from the database.
 * This must include the app member and organization relationships.
 * @param resource - The resource as fetched from the database.
 * @param resourceType - The resource type to check the role for.
 * @param action - The resource action to theck the role for.
 *
 * @returns Query options to filter the resource for the user context.
 */
async function verifyAppRole(
  ctx: KoaContext,
  app: App,
  resource: Resource,
  resourceType: string,
  action: 'create' | 'delete' | 'get' | 'query' | 'update',
): Promise<WhereOptions> {
  if (!app.definition.resources[resourceType] || !app.definition.resources[resourceType][action]) {
    return;
  }

  const { user } = ctx;
  let { roles } = app.definition.resources[resourceType][action];

  if (!roles || !roles.length) {
    if (app.definition.roles?.length) {
      ({ roles } = app.definition);
    } else {
      return;
    }
  }

  const author = roles.includes('$author');
  const filteredRoles = roles.filter((r) => r !== '$author');

  if (!author && !filteredRoles.length) {
    return;
  }

  if (!user && (filteredRoles.length || author)) {
    throw unauthorized('User is not logged in');
  }

  if (author && user && action === 'query') {
    return { UserId: user.id };
  }

  if (author && user && resource && user.id === resource.UserId) {
    return;
  }

  const member = app.Users.find((u) => u.id === user.id);
  const { policy, role: defaultRole } = app.definition.security.default;
  let role: string;

  if (member) {
    ({ role } = member.AppMember);
  } else {
    switch (policy) {
      case 'everyone':
        role = defaultRole;
        break;

      case 'organization':
        if (!(await app.Organization.$has('User', user.id))) {
          throw forbidden('User is not a member of the organization.');
        }

        role = defaultRole;
        break;

      case 'invite':
        throw forbidden('User is not a member of the app.');

      default:
        role = null;
    }
  }

  if (!filteredRoles.some((r) => checkAppRole(app.definition.security, r, role))) {
    throw forbidden('User does not have sufficient permissions.');
  }
}

export async function queryResources(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, resourceType },
    query: { $filter, $orderby, $top },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    ...(user && {
      include: [
        { model: Organization, attributes: [] },
        {
          model: User,
          attributes: ['id'],
          required: false,
          where: { id: user.id },
          through: { attributes: ['role'] },
        },
      ],
    }),
  });
  verifyResourceDefinition(app, resourceType);
  const userQuery = await verifyAppRole(ctx, app, null, resourceType, 'query');

  let order: Order;
  let query: WhereOptions;
  try {
    order = $orderby && odataOrderbyToSequelize($orderby, renameOData);
    query = odataFilterToSequelize($filter, renameOData);
  } catch {
    throw badRequest('Unable to process this query');
  }

  const resources = await Resource.findAll({
    include: [{ model: User, attributes: ['id', 'name'], required: false }],
    limit: $top,
    order,
    where: {
      [Op.and]: [
        query,
        {
          ...userQuery,
          type: resourceType,
          AppId: appId,
          expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
        },
      ],
    },
  });

  ctx.body = resources.map((resource) => ({
    ...resource.data,
    id: resource.id,
    $created: resource.created,
    $updated: resource.updated,
    $clonable: resource.clonable,
    ...(resource.expires != null && {
      $expires: resource.expires,
    }),
    ...(resource.User && { $author: { id: resource.User.id, name: resource.User.name } }),
  }));
}

export async function getResourceById(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, resourceId, resourceType },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    ...(user && {
      include: [
        { model: Organization, attributes: [] },
        {
          model: User,
          attributes: ['id'],
          required: false,
          where: { id: user.id },
          through: { attributes: ['role'] },
        },
      ],
    }),
  });
  verifyResourceDefinition(app, resourceType);

  const resource = await Resource.findOne({
    where: {
      AppId: appId,
      id: resourceId,
      type: resourceType,
      expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
    },
    include: [{ model: User, attributes: ['name'], required: false }],
  });

  if (!resource) {
    throw notFound('Resource not found');
  }

  await verifyAppRole(ctx, app, resource, resourceType, 'get');

  ctx.body = {
    ...resource.data,
    id: resource.id,
    $created: resource.created,
    $updated: resource.updated,
    ...(resource.expires != null && {
      $expires: resource.expires,
    }),
    ...(resource.UserId != null && {
      $author: { id: resource.UserId, name: resource.User.name },
    }),
  };
}

export async function getResourceTypeSubscription(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, resourceType },
    query: { endpoint },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: Resource,
        attributes: ['id'],
        where: { type: resourceType },
        required: false,
      },
      {
        attributes: ['id', 'UserId'],
        model: AppSubscription,
        include: [
          {
            model: ResourceSubscription,
            where: { type: resourceType },
            required: false,
          },
        ],
        required: false,
        where: { endpoint },
      },
    ],
  });
  verifyResourceDefinition(app, resourceType);

  if (!app.Resources.length) {
    throw notFound('Resource not found.');
  }

  if (!app.AppSubscriptions.length) {
    throw notFound('User is not subscribed to this app.');
  }

  const [appSubscription] = app.AppSubscriptions;

  if (!appSubscription) {
    throw notFound('Subscription not found');
  }

  ctx.body = appSubscription.ResourceSubscriptions.reduce(
    (acc, { ResourceId, action }) => {
      if (ResourceId) {
        if (!acc.subscriptions) {
          acc.subscriptions = {};
        }

        if (!acc.subscriptions[ResourceId]) {
          acc.subscriptions[ResourceId] = { update: false, delete: false };
        }

        acc.subscriptions[ResourceId] = {
          ...acc.subscriptions[ResourceId],
          [action]: true,
        };

        return acc;
      }

      acc[action] = true;
      return acc;
    },
    { create: false, update: false, delete: false } as any,
  );
}

export async function getResourceSubscription(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, resourceId, resourceType },
    query: { endpoint },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: Resource,
        attributes: ['id'],
        where: { id: resourceId },
        required: false,
      },
      {
        attributes: ['id', 'UserId'],
        model: AppSubscription,
        include: [
          {
            model: ResourceSubscription,
            where: { type: resourceType, ResourceId: resourceId },
            required: false,
          },
        ],
        required: false,
        where: { endpoint },
      },
    ],
  });
  verifyResourceDefinition(app, resourceType);

  if (!app.Resources.length) {
    throw notFound('Resource not found.');
  }

  const subscriptions = app.AppSubscriptions?.[0]?.ResourceSubscriptions ?? [];
  const result: any = { id: resourceId, update: false, delete: false };

  subscriptions.forEach(({ action }) => {
    result[action] = true;
  });

  ctx.body = result;
}

export async function createResource(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, resourceType },
    request: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      body: { $expires = null, id: _, ...resource },
    },
    user,
  } = ctx;
  const action = 'create';

  const app = await App.findByPk(appId, {
    ...(user && {
      include: [
        { model: Organization, attributes: [] },
        {
          model: User,
          attributes: ['id'],
          required: false,
          where: { id: user.id },
          through: { attributes: ['role'] },
        },
      ],
    }),
  });

  verifyResourceDefinition(app, resourceType);

  await verifyAppRole(ctx, app, resource, resourceType, action);
  const { expires, schema } = app.definition.resources[resourceType];

  try {
    await validate(schema, resource);
  } catch (err: unknown) {
    if (!(err instanceof SchemaValidationError)) {
      throw err;
    }

    const boom = badRequest(err.message);
    (boom.output.payload as any).data = err.data;
    throw boom;
  }

  let expireDate: Date;
  // Manual $expire takes precedence over the default calculated expiration date
  if ($expires) {
    expireDate = parseISO($expires);
    if (isPast(expireDate)) {
      throw badRequest('Expiration date has already passed.');
    }
  } else if (expires) {
    const expireDuration = parseDuration(expires);

    if (expireDuration && expireDuration > 0) {
      expireDate = addMilliseconds(new Date(), expireDuration);
    }
  }

  const createdResource = await Resource.create({
    AppId: app.id,
    type: resourceType,
    data: resource,
    UserId: user?.id,
    expires: expireDate,
  });

  ctx.body = {
    ...resource,
    id: createdResource.id,
    $created: createdResource.created,
    $updated: createdResource.updated,
    ...(createdResource.expires != null && {
      $expires: createdResource.expires,
    }),
    ...(resource.UserId != null && {
      $author: { id: resource.UserId, name: resource.User.name },
    }),
  };
  ctx.status = 201;

  processReferenceHooks(ctx.argv.host, ctx.user, app, createdResource, action);
  processHooks(ctx.argv.host, ctx.user, app, createdResource, action);
}

export async function updateResource(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, resourceId, resourceType },
    request: {
      body: { $clonable: clonable = false, $expires = null, ...updatedResource },
    },
    user,
  } = ctx;
  const action = 'update';

  const app = await App.findByPk(appId, {
    ...(user && {
      include: [
        { model: Organization, attributes: [] },
        {
          model: User,
          attributes: ['id'],
          required: false,
          where: { id: user.id },
          through: { attributes: ['role'] },
        },
      ],
    }),
  });

  verifyResourceDefinition(app, resourceType);

  let resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId },
    include: [{ model: User, attributes: ['id', 'name'], required: false }],
  });

  if (!resource) {
    throw notFound('Resource not found');
  }

  await verifyAppRole(ctx, app, resource, resourceType, action);

  const { schema } = app.definition.resources[resourceType];

  try {
    await validate(schema, updatedResource);
  } catch (err: unknown) {
    if (!(err instanceof SchemaValidationError)) {
      throw err;
    }

    const boom = badRequest(err.message);
    (boom.output.payload as any).data = err.data;
    throw boom;
  }

  let { expires } = resource;
  if ($expires) {
    expires = parseISO($expires);
    if (isPast(expires)) {
      throw badRequest('Expiration date has already passed.');
    }
  }

  resource.changed('updated', true);
  resource = await resource.update(
    { data: updatedResource, clonable, expires },
    { where: { id: resourceId, type: resourceType, AppId: appId } },
  );

  await resource.reload();

  ctx.body = {
    ...resource.get('data', { plain: true }),
    id: resourceId,
    $created: resource.created,
    $updated: resource.updated,
    ...(resource.expires != null && {
      $expires: resource.expires,
    }),
    ...(resource.UserId != null && {
      $author: { id: resource.UserId, name: resource.User.name },
    }),
  };

  processReferenceHooks(ctx.argv.host, ctx.user, app, resource, action);
  processHooks(ctx.argv.host, ctx.user, app, resource, action);
}

export async function deleteResource(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, resourceId, resourceType },
    user,
  } = ctx;
  const action = 'delete';

  const app = await App.findByPk(appId, {
    ...(user && {
      include: [
        { model: Organization, attributes: [] },
        {
          model: User,
          attributes: ['id'],
          required: false,
          where: { id: user.id },
          through: { attributes: ['role'] },
        },
      ],
    }),
  });

  await checkRole(ctx, app.OrganizationId, Permission.ManageResources);

  verifyResourceDefinition(app, resourceType);
  const resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId },
  });

  if (!resource) {
    throw notFound('Resource not found');
  }

  await verifyAppRole(ctx, app, resource, resourceType, action);

  await resource.destroy();
  ctx.status = 204;

  processReferenceHooks(ctx.argv.host, ctx.user, app, resource, action);
  processHooks(ctx.argv.host, ctx.user, app, resource, action);
}
