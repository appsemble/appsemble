import { logger } from '@appsemble/node-utils';
import {
  checkAppRole,
  Permission,
  SchemaValidationError,
  TeamRole,
  validate,
} from '@appsemble/utils';
import { badRequest, forbidden, internal, notFound, unauthorized } from '@hapi/boom';
import { addMilliseconds, isPast, parseISO } from 'date-fns';
import { pick } from 'lodash';
import { OpenAPIV3 } from 'openapi-types';
import parseDuration from 'parse-duration';
import { Op, Order, WhereOptions } from 'sequelize';

import {
  App,
  AppSubscription,
  Organization,
  Resource,
  ResourceSubscription,
  TeamMember,
  User,
} from '../models';
import { KoaContext } from '../types';
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

const specialRoles = new Set(['$author', ...Object.values(TeamRole).map((r) => `$team:${r}`)]);

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
 * Generate Sequelize filter objects based on ODATA filters present in the request.
 *
 * @param ctx - The KoaContext to extract the parameters from.
 * @returns An object containing the generated order and query options.
 */
function generateQuery(ctx: KoaContext<Params>): { order: Order; query: WhereOptions } {
  const {
    query: { $filter, $orderby },
  } = ctx;

  try {
    const order =
      $orderby &&
      odataOrderbyToSequelize(
        $orderby
          .replace(/(^|\B)\$created(\b|$)/g, '__created__')
          .replace(/(^|\B)\$updated(\b|$)/g, '__updated__'),
        renameOData,
      );
    const query =
      $filter &&
      odataFilterToSequelize(
        $filter
          .replace(/(^|\B)\$created(\b|$)/g, '__created__')
          .replace(/(^|\B)\$updated(\b|$)/g, '__updated__'),
        Resource,
        renameOData,
      );

    return { order, query };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw badRequest('Unable to process this query', { syntaxError: error.message });
    }
    logger.error(error);
    throw internal('Unable to process this query');
  }
}

/**
 * Verifies whether or not the user has sufficient permissions to perform a resource call.
 * Will throw an 403 error if the user does not satisfy the requirements.
 *
 * @param ctx - Koa context of the request
 * @param app - App as fetched from the database.
 * This must include the app member and organization relationships.
 * @param resourceType - The resource type to check the role for.
 * @param action - The resource action to theck the role for.
 *
 * @returns Query options to filter the resource for the user context.
 */
async function verifyPermission(
  ctx: KoaContext,
  app: App,
  resourceType: string,
  action: 'create' | 'delete' | 'get' | 'query' | 'update' | 'count',
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

  const functionalRoles = roles.filter((r) => specialRoles.has(r));
  const appRoles = roles.filter((r) => !specialRoles.has(r));

  if (!functionalRoles.length && !appRoles.length) {
    return;
  }

  if (!user && (appRoles.length || functionalRoles.length)) {
    throw unauthorized('User is not logged in');
  }

  const result = [];

  if (functionalRoles.includes('$author') && user && action !== 'create') {
    result.push({ UserId: user.id });
  }

  if (functionalRoles.includes(`$team:${TeamRole.Member}`)) {
    const teamIds = (
      await TeamMember.findAll({
        where: { UserId: user.id, role: TeamRole.Member },
        raw: true,
        attributes: ['TeamId'],
      })
    ).map((t) => t.TeamId);

    const userIds = (
      await TeamMember.findAll({
        attributes: ['UserId'],
        raw: true,
        where: { TeamId: teamIds },
      })
    ).map((tm) => tm.UserId);
    result.push({ UserId: { [Op.in]: userIds } });
  }

  if (functionalRoles.includes(`$team:${TeamRole.Manager}`)) {
    const teamIds = (
      await TeamMember.findAll({
        where: { UserId: user.id },
        raw: true,
        attributes: ['TeamId'],
      })
    ).map((t) => t.TeamId);

    const userIds = (
      await TeamMember.findAll({
        attributes: ['UserId'],
        raw: true,
        where: { TeamId: teamIds },
      })
    ).map((tm) => tm.UserId);
    result.push({ UserId: { [Op.in]: userIds } });
  }

  if (app.definition.security) {
    const member = app.Users.find((u) => u.id === user.id);
    const { policy, role: defaultRole } = app.definition?.security?.default;
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

    if (!appRoles.some((r) => checkAppRole(app.definition.security, r, role))) {
      if (!result.length) {
        throw forbidden('User does not have sufficient permissions.');
      }
    }
  }

  if (result.length === 0) {
    return;
  }

  return result.length === 1 ? result[0] : { [Op.or]: result };
}

export async function queryResources(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, resourceType },
    query: { $select, $top },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    ...(user && {
      include: [
        { model: Organization, attributes: ['id'] },
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
  const userQuery = await verifyPermission(ctx, app, resourceType, 'query');
  const { order, query } = generateQuery(ctx);

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

  let response = resources.map((resource) => ({
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

  if ($select) {
    const select = $select.split(',');
    response = response.map((resource) => pick(resource, select));
  }

  ctx.body = response;
}

export async function countResources(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, resourceType },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    ...(user && {
      include: [
        { model: Organization, attributes: ['id'] },
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
  const userQuery = await verifyPermission(ctx, app, resourceType, 'count');
  const { query } = generateQuery(ctx);

  const count = await Resource.count({
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

  ctx.body = count;
}

export async function getResourceById(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, resourceId, resourceType },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    ...(user && {
      include: [
        { model: Organization, attributes: ['id'] },
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
  const userQuery = await verifyPermission(ctx, app, resourceType, 'get');

  const resource = await Resource.findOne({
    where: {
      AppId: appId,
      id: resourceId,
      type: resourceType,
      expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
      ...userQuery,
    },
    include: [{ model: User, attributes: ['name'], required: false }],
  });

  if (!resource) {
    throw notFound('Resource not found');
  }

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
        { model: Organization, attributes: ['id'] },
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
  await verifyPermission(ctx, app, resourceType, action);

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
        { model: Organization, attributes: ['id'] },
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
  const userQuery = await verifyPermission(ctx, app, resourceType, action);

  let resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId, ...userQuery },
    include: [{ model: User, attributes: ['id', 'name'], required: false }],
  });

  if (!resource) {
    throw notFound('Resource not found');
  }

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
        { model: Organization, attributes: ['id'] },
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
  const userQuery = await verifyPermission(ctx, app, resourceType, action);

  const resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId, ...userQuery },
  });

  if (!resource) {
    throw notFound('Resource not found');
  }

  await resource.destroy();
  ctx.status = 204;

  processReferenceHooks(ctx.argv.host, ctx.user, app, resource, action);
  processHooks(ctx.argv.host, ctx.user, app, resource, action);
}
