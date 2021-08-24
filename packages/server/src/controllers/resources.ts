import { logger } from '@appsemble/node-utils';
import { checkAppRole, Permission, TeamRole } from '@appsemble/utils';
import { badRequest, forbidden, internal, notFound, unauthorized } from '@hapi/boom';
import { addMilliseconds, isPast } from 'date-fns';
import { Context } from 'koa';
import { pick } from 'lodash';
import { OpenAPIV3 } from 'openapi-types';
import parseDuration from 'parse-duration';
import { Op, Order, WhereOptions } from 'sequelize';

import {
  App,
  AppSubscription,
  Asset,
  Organization,
  Resource,
  ResourceSubscription,
  Team,
  TeamMember,
  transactional,
  User,
} from '../models';
import { checkRole } from '../utils/checkRole';
import { odataFilterToSequelize, odataOrderbyToSequelize } from '../utils/odata';
import {
  processHooks,
  processReferenceHooks,
  processResourceBody,
  renameOData,
  verifyResourceBody,
} from '../utils/resource';

const specialRoles = new Set([
  '$author',
  '$public',
  ...Object.values(TeamRole).map((r) => `$team:${r}`),
]);

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
 * @param ctx - The Context to extract the parameters from.
 * @returns An object containing the generated order and query options.
 */
function generateQuery(ctx: Context): { order: Order; query: WhereOptions } {
  const {
    query: { $filter, $orderby },
  } = ctx;

  try {
    const order =
      $orderby &&
      odataOrderbyToSequelize(
        ($orderby as string)
          .replace(/(^|\B)\$created(\b|$)/g, '__created__')
          .replace(/(^|\B)\$updated(\b|$)/g, '__updated__'),
        renameOData,
      );
    const query =
      $filter &&
      odataFilterToSequelize(
        ($filter as string)
          .replace(/(^|\B)\$created(\b|$)/g, '__created__')
          .replace(/(^|\B)\$updated(\b|$)/g, '__updated__')
          .replace(/(^|\B)\$author\/id(\b|$)/g, '__author__'),
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
 * @returns Query options to filter the resource for the user context.
 */
async function verifyPermission(
  ctx: Context,
  app: App,
  resourceType: string,
  action: 'count' | 'create' | 'delete' | 'get' | 'query' | 'update',
): Promise<WhereOptions> {
  if (!app.definition.resources[resourceType] && !app.definition.resources[resourceType][action]) {
    return;
  }

  const {
    query: { $team },
    user,
    users,
  } = ctx;

  if ('studio' in users || 'cli' in users) {
    await (action === 'count' || action === 'get' || action === 'query'
      ? checkRole(ctx, app.OrganizationId, Permission.ReadResources)
      : checkRole(ctx, app.OrganizationId, Permission.ManageResources));
    return;
  }

  let roles =
    app.definition.resources?.[resourceType]?.[action]?.roles ??
    app.definition.resources?.[resourceType]?.roles ??
    [];

  if ((!roles || !roles.length) && app.definition.roles?.length) {
    ({ roles } = app.definition);
  }

  const functionalRoles = roles.filter((r) => specialRoles.has(r));
  const appRoles = roles.filter((r) => !specialRoles.has(r));
  const isPublic = functionalRoles.includes('$public');

  if ($team && !functionalRoles.includes(`$team:${$team}`)) {
    functionalRoles.push(`$team:${$team}`);
  }

  if (!functionalRoles.length && !appRoles.length) {
    throw forbidden('This action is private.');
  }

  if (isPublic && action !== 'count') {
    return;
  }

  if (!isPublic && !user && (appRoles.length || functionalRoles.length)) {
    throw unauthorized('User is not logged in.');
  }

  const result = [];

  if (functionalRoles.includes('$author') && user && action !== 'create') {
    result.push({ UserId: user.id });
  }

  if (functionalRoles.includes(`$team:${TeamRole.Member}`) && user) {
    const teamIds = (
      await Team.findAll({
        where: { AppId: app.id },
        include: [{ model: User, where: { id: user.id } }],
        attributes: ['id'],
      })
    ).map((t) => t.id);

    const userIds = (
      await TeamMember.findAll({
        attributes: ['UserId'],
        where: { TeamId: teamIds },
      })
    ).map((tm) => tm.UserId);
    result.push({ UserId: { [Op.in]: userIds } });
  }

  if (functionalRoles.includes(`$team:${TeamRole.Manager}`) && user) {
    const teamIds = (
      await Team.findAll({
        where: { AppId: app.id },
        include: [
          { model: User, where: { id: user.id }, through: { where: { role: TeamRole.Manager } } },
        ],
        attributes: ['id'],
      })
    ).map((t) => t.id);

    const userIds = (
      await TeamMember.findAll({
        attributes: ['UserId'],
        raw: true,
        where: { TeamId: teamIds },
      })
    ).map((tm) => tm.UserId);
    result.push({ UserId: { [Op.in]: userIds } });
  }

  if (app.definition.security && !isPublic) {
    const member = app.Users?.find((u) => u.id === user?.id);
    const { policy = 'everyone', role: defaultRole } = app.definition.security.default;
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

    // Team roles are checked separately
    // XXX unify this logic?
    if (
      !appRoles.some((r) => checkAppRole(app.definition.security, r, role, null)) &&
      !result.length
    ) {
      throw forbidden('User does not have sufficient permissions.');
    }
  }

  if (result.length === 0) {
    return;
  }

  return result.length === 1 ? result[0] : { [Op.or]: result };
}

export async function queryResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
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
    limit: $top && Number.parseInt($top as string),
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
    $clonable: app.template ? resource.clonable : undefined,
    ...(resource.expires != null && {
      $expires: resource.expires,
    }),
    ...(resource.User && { $author: { id: resource.User.id, name: resource.User.name } }),
  }));

  if ($select) {
    const select = ($select as string).split(',').map((s) => s.trim());
    response = response.map((resource) => pick(resource, select));
  }

  ctx.body = response;
}

export async function countResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
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

export async function getResourceById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
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

export async function getResourceTypeSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
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

export async function getResourceSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
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

  for (const { action } of subscriptions) {
    result[action] = true;
  }

  ctx.body = result;
}

export async function createResource(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    user,
  } = ctx;
  const [resource, assets, $expires] = processResourceBody(ctx);
  const action = 'create';

  const app = await App.findByPk(
    appId,
    user && {
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
    },
  );

  verifyResourceDefinition(app, resourceType);
  await verifyPermission(ctx, app, resourceType, action);

  const { expires, schema } = app.definition.resources[resourceType];
  const [preparedAssets] = verifyResourceBody(resourceType, schema, resource, assets);

  let expireDate: Date;
  // Manual $expire takes precedence over the default calculated expiration date
  if ($expires) {
    if (isPast($expires)) {
      throw badRequest('Expiration date has already passed.');
    }
    expireDate = $expires;
  } else if (expires) {
    const expireDuration = parseDuration(expires);

    if (expireDuration && expireDuration > 0) {
      expireDate = addMilliseconds(new Date(), expireDuration);
    }
  }

  await user?.reload({ attributes: ['name'] });
  let createdResource: Resource;
  await transactional(async (transaction) => {
    createdResource = await Resource.create(
      { AppId: app.id, type: resourceType, data: resource, UserId: user?.id, expires: expireDate },
      { transaction },
    );
    await Asset.bulkCreate(
      preparedAssets.map((asset) => ({
        ...asset,
        AppId: app.id,
        ResourceId: createdResource.id,
        UserId: user?.id,
      })),
      { logging: false, transaction },
    );
  });

  ctx.body = {
    ...resource,
    id: createdResource.id,
    $created: createdResource.created,
    $updated: createdResource.updated,
    $expires: createdResource.expires ?? undefined,
    $author: user ? { id: user.id, name: user.name } : undefined,
  };

  processReferenceHooks(user, app, createdResource, action);
  processHooks(user, app, createdResource, action);
}

export async function updateResource(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    user,
  } = ctx;
  const [updatedResource, assets, $expires, clonable] = processResourceBody(ctx);
  const action = 'update';

  const app = await App.findByPk(
    appId,
    user && {
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
    },
  );

  verifyResourceDefinition(app, resourceType);
  const userQuery = await verifyPermission(ctx, app, resourceType, action);

  const resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId, ...userQuery },
    include: [
      { model: User, attributes: ['id', 'name'], required: false },
      { model: Asset, attributes: ['id'], required: false },
    ],
  });

  if (!resource) {
    throw notFound('Resource not found');
  }

  const { schema } = app.definition.resources[resourceType];
  const [preparedAssets, deletedAssetIds] = verifyResourceBody(
    resourceType,
    schema,
    updatedResource,
    assets,
    resource.Assets.map((asset) => asset.id),
  );

  let { expires } = resource;
  if ($expires) {
    if (isPast($expires)) {
      throw badRequest('Expiration date has already passed.');
    }
    expires = $expires;
  }

  await transactional((transaction) =>
    Promise.all([
      resource.update({ data: updatedResource, clonable, expires }, { transaction }),
      Asset.bulkCreate(
        preparedAssets.map((asset) => ({
          ...asset,
          AppId: app.id,
          ResourceId: resource.id,
          UserId: user?.id,
        })),
        { logging: false, transaction },
      ),
      Asset.destroy({ where: { id: deletedAssetIds } }),
    ]),
  );

  ctx.body = {
    ...resource.data,
    id: resourceId,
    $clonable: app.template ? clonable : undefined,
    $created: resource.created,
    $updated: resource.updated,
    $expires: resource.expires ?? undefined,
    $author: resource.UserId ? { id: resource.UserId, name: resource.User.name } : undefined,
  };

  processReferenceHooks(user, app, resource, action);
  processHooks(user, app, resource, action);
}

export async function deleteResource(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
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

  processReferenceHooks(user, app, resource, action);
  processHooks(user, app, resource, action);
}
