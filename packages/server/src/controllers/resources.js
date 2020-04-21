import { checkAppRole, permissions, SchemaValidationError, validate } from '@appsemble/utils';
import Boom from '@hapi/boom';
import parseOData from '@wesselkuipers/odata-sequelize';
import crypto from 'crypto';
import { Op } from 'sequelize';

import {
  App,
  AppSubscription,
  getDB,
  Organization,
  Resource,
  ResourceSubscription,
  User,
} from '../models';
import checkRole from '../utils/checkRole';
import sendNotification from '../utils/sendNotification';

function verifyResourceDefinition(app, resourceType) {
  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!app.definition.resources) {
    throw Boom.notFound('App does not have any resources defined');
  }

  if (!app.definition.resources[resourceType]) {
    throw Boom.notFound(`App does not have resources called ${resourceType}`);
  }

  if (!app.definition.resources[resourceType].schema) {
    throw Boom.notFound(`App does not have a schema for resources called ${resourceType}`);
  }

  const resource = app.definition.resources[resourceType];
  const referenceProperties = {};

  if (resource.references) {
    Object.entries(resource.references).forEach(([field, resourceName]) => {
      if (!app.definition.resources[resourceName]) {
        throw Boom.notFound(
          `Resource ${resourceName} referenced by ${resourceType} does not exist.`,
        );
      }

      referenceProperties[field] = app.definition.resources[resourceName].id || {};
    });
  }

  return {
    ...resource.schema,
    properties: {
      ...resource.schema.properties,
      ...referenceProperties,
    },
  };
}

function generateQuery(ctx, { createdHash, updatedHash }) {
  if (ctx.querystring) {
    try {
      return parseOData(
        decodeURIComponent(
          ctx.querystring
            .replace(/\+/g, '%20')
            .replace(/\$updated/g, updatedHash)
            .replace(/\$created/g, createdHash),
        ),
        getDB(),
      );
    } catch (e) {
      return {};
    }
  }

  return {};
}

/**
 * Iterates through all keys in an object and preprends matched keys with ´data.´
 * @param {Object} object Object to iterate through
 * @param {string[]} keys Keys to match with
 */
const deepRename = (object, keys, { createdHash, updatedHash }) => {
  if (!object) {
    return {};
  }

  const isArray = Array.isArray(object);
  const obj = isArray ? [...object] : { ...object };

  const entries = [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
  entries.forEach((key) => {
    const value = obj[key];

    if (isArray) {
      if (keys.some((k) => k === value)) {
        obj[key] = `data.${value}`;
      }
    } else if (keys.some((k) => k === key)) {
      obj[`data.${key}`] = value;
      delete obj[key];
    }

    if (value === updatedHash) {
      obj[key] = 'updated';
    } else if (value === createdHash) {
      obj[key] = 'created';
    }

    if (key === updatedHash) {
      obj.updated = obj[key];
      delete obj[key];
    } else if (key === createdHash) {
      obj.created = obj[key];
      delete obj[key];
    }

    if (!!obj[key] && (obj[key] instanceof Object || Array.isArray(obj[key]))) {
      obj[key] = deepRename(obj[key], keys, { updatedHash, createdHash });
    }
  });

  return obj;
};

/**
 * Verifies whether or not the user has sufficient permissions to perform a resource call.
 * Will throw an 403 error if the user does not satisfy the requirements.
 *
 * @param {*} ctx Koa context of the request
 * @param {*} app App as fetched from the database.
 * This must include the app member and organization relationships.
 * @param {*} resource The resource as fetched from the database.
 */
async function verifyAppRole(ctx, app, resource, resourceType, action) {
  if (!app.definition.resources[resourceType] || !app.definition.resources[resourceType][action]) {
    return;
  }

  const { user } = ctx.state;
  let { roles } = app.definition.resources[resourceType][action];

  if (!roles || !roles.length) {
    if (app.definition.roles && app.definition.roles.length) {
      roles = app.definition.roles;
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
    throw Boom.unauthorized('User is not logged in');
  }

  if (author && user && resource && user.id === resource.UserId) {
    return;
  }

  const member = app.Users.find((u) => u.id === user.id);
  const { policy, role: defaultRole } = app.definition.security.default;
  let role;

  if (member) {
    role = member.AppMember.role;
  } else {
    switch (policy) {
      case 'everyone':
        role = defaultRole;
        break;

      case 'organization':
        if (!(await app.Organization.hasUser(user.id))) {
          throw Boom.forbidden('User is not a member of the organization.');
        }

        role = defaultRole;
        break;

      case 'invite':
        throw Boom.forbidden('User is not a member of the app.');

      default:
        role = null;
    }
  }

  if (!filteredRoles.some((r) => checkAppRole(app.definition.security, r, role))) {
    throw Boom.forbidden('User does not have sufficient permissions.');
  }
}

async function sendSubscriptionNotifications(
  ctx,
  app,
  notification,
  resourceUserId,
  resourceType,
  action,
  resourceId,
  options,
) {
  const { appId } = ctx.params;
  const roles = notification.to.filter((n) => n !== '$author');
  const author = resourceUserId && notification.to.includes('$author');
  const subscribers = notification.subscribe;

  if (!roles.length && !author && !subscribers) {
    return;
  }

  const subscriptions = [];

  if (roles || author) {
    const roleSubscribers = await AppSubscription.findAll({
      where: { AppId: appId },
      attributes: ['id', 'auth', 'p256dh', 'endpoint'],
      include: [
        {
          model: User,
          attributes: [],
          required: true,
          include: [
            {
              model: App,
              attributes: [],
              where: { id: appId },
              through: {
                attributes: [],
                where: {
                  [Op.or]: [
                    ...(author ? [{ UserId: resourceUserId }] : []),
                    ...(roles.length ? [{ role: roles }] : []),
                  ],
                },
              },
            },
          ],
        },
      ],
    });

    subscriptions.push(...roleSubscribers);
  }

  if (subscribers) {
    const resourceSubscribers = await AppSubscription.findAll({
      attributes: ['id', 'auth', 'p256dh', 'endpoint'],
      where: { AppId: appId },
      include: [
        {
          model: ResourceSubscription,
          attributes: ['ResourceId'],
          where: {
            type: resourceType,
            action,
            ...(resourceId
              ? { ResourceId: { [Op.or]: [null, resourceId] } }
              : { ResourceId: null }),
          },
        },
      ],
    });

    subscriptions.push(...resourceSubscribers);
  }

  subscriptions.forEach((subscription) => {
    sendNotification(ctx, app, subscription, options);
  });
}

export async function queryResources(ctx) {
  const updatedHash = `updated${crypto.randomBytes(5).toString('hex')}`;
  const createdHash = `created${crypto.randomBytes(5).toString('hex')}`;

  const query = generateQuery(ctx, { updatedHash, createdHash });
  const { appId, resourceType } = ctx.params;
  const { user } = ctx.state;

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
  const { properties } = verifyResourceDefinition(app, resourceType);
  await verifyAppRole(ctx, app, null, resourceType, 'query');

  const keys = Object.keys(properties);
  // the data is stored in the ´data´ column as json
  const renamedQuery = deepRename(query, keys, { updatedHash, createdHash });

  try {
    const resources = await app.getResources({
      ...renamedQuery,
      where: { ...renamedQuery.where, type: resourceType },
      include: [{ model: User, attributes: ['id', 'name'], required: false }],
    });

    ctx.body = resources.map((resource) => ({
      ...resource.data,
      id: resource.id,
      $created: resource.created,
      $updated: resource.updated,
      ...(resource.User && { $author: { id: resource.User.id, name: resource.User.name } }),
    }));
  } catch (e) {
    if (query) {
      throw Boom.badRequest('Unable to process this query');
    }

    throw e;
  }
}

export async function getResourceById(ctx) {
  const { appId, resourceId, resourceType } = ctx.params;
  const { user } = ctx.state;

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

  const [resource] = await app.getResources({
    where: { id: resourceId, type: resourceType },
    include: [{ model: User, attributes: ['name'], required: false }],
    raw: true,
  });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  await verifyAppRole(ctx, app, resource, resourceType, 'get');

  ctx.body = {
    ...resource.data,
    id: resource.id,
    $created: resource.created,
    $updated: resource.updated,
    ...(resource.UserId != null && {
      $author: { id: resource.UserId, name: resource['User.name'] },
    }),
  };
}

export async function getResourceTypeSubscription(ctx) {
  const { appId, resourceType } = ctx.params;
  const { endpoint } = ctx.query;

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
    throw Boom.notFound('Resource not found.');
  }

  if (!app.AppSubscriptions.length) {
    throw Boom.notFound('User is not subscribed to this app.');
  }

  const [appSubscription] = app.AppSubscriptions;

  if (!appSubscription) {
    throw Boom.notFound('Subscription not found');
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
    { create: false, update: false, delete: false },
  );
}

export async function getResourceSubscription(ctx) {
  const { appId, resourceId, resourceType } = ctx.params;
  const { endpoint } = ctx.query;

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
    throw Boom.notFound('Resource not found.');
  }

  if (!app.AppSubscriptions.length) {
    throw Boom.notFound('User is not subscribed to this app.');
  }

  const subscriptions = app.AppSubscriptions[0].ResourceSubscriptions;
  const result = { id: resourceId, update: false, delete: false };

  subscriptions.forEach(({ action }) => {
    result[action] = true;
  });

  ctx.body = result;
}

export async function createResource(ctx) {
  const { appId, resourceType } = ctx.params;
  const { user } = ctx.state;

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

  const { id: _, ...resource } = ctx.request.body;
  await verifyAppRole(ctx, app, resource, resourceType, 'create');
  const { schema } = app.definition.resources[resourceType];

  try {
    await validate(schema, resource);
  } catch (err) {
    if (!(err instanceof SchemaValidationError)) {
      throw err;
    }

    const boom = Boom.badRequest(err.message);
    boom.output.payload.data = err.data;
    throw boom;
  }

  const { created, id, updated } = await app.createResource({
    type: resourceType,
    data: resource,
    UserId: user && user.id,
  });

  ctx.body = { ...resource, id, $created: created, $updated: updated };
  ctx.status = 201;

  const resourceDefinition = app.definition.resources[resourceType];
  if (
    resourceDefinition.create &&
    resourceDefinition.create.hooks &&
    resourceDefinition.create.hooks.notification
  ) {
    const { notification } = resourceDefinition.create.hooks;
    const { data } = notification;
    sendSubscriptionNotifications(ctx, app, notification, null, resourceType, 'create', id, {
      title: data && data.title ? data.title : resourceType,
      body: data && data.body ? data.body : 'Created new',
    });
  }
}

export async function updateResource(ctx) {
  const { appId, resourceId, resourceType } = ctx.params;
  const { user } = ctx.state;

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
  });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  await verifyAppRole(ctx, app, resource, resourceType, 'update');

  const { id: _, ...updatedResource } = ctx.request.body;
  const { schema } = app.definition.resources[resourceType];

  try {
    await validate(schema, updatedResource);
  } catch (err) {
    if (!(err instanceof SchemaValidationError)) {
      throw err;
    }

    const boom = Boom.badRequest(err.message);
    boom.output.payload.data = err.data;
    throw boom;
  }

  resource.changed('updatedAt', true);
  resource = await resource.update(
    { data: updatedResource },
    { where: { id: resourceId, type: resourceType, AppId: appId } },
  );

  await resource.reload();

  ctx.body = {
    ...resource.get('data', { plain: true }),
    id: resourceId,
    $created: resource.created,
    $updated: resource.updated,
  };

  const resourceDefinition = app.definition.resources[resourceType];
  if (
    resourceDefinition.update &&
    resourceDefinition.update.hooks &&
    resourceDefinition.update.hooks.notification
  ) {
    const { notification } = resourceDefinition.create.hooks;
    const { data } = notification;
    sendSubscriptionNotifications(
      ctx,
      app,
      notification,
      null,
      resourceType,
      'update',
      resourceId,
      {
        title: data && data.title ? data.title : resourceType,
        body: data && data.body ? data.body : `Updated ${resource.id}`,
      },
    );
  }
}

export async function deleteResource(ctx) {
  const { appId, resourceId, resourceType } = ctx.params;
  const { user } = ctx.state;

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

  await checkRole(ctx, app.OrganizationId, permissions.ManageResources);

  verifyResourceDefinition(app, resourceType);
  const resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId },
  });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  await verifyAppRole(ctx, app, resource, resourceType, 'delete');

  await resource.destroy();
  ctx.status = 204;

  const resourceDefinition = app.definition.resources[resourceType];
  if (
    resourceDefinition.delete &&
    resourceDefinition.delete.hooks &&
    resourceDefinition.delete.hooks.notification
  ) {
    const { notification } = resourceDefinition.create.hooks;
    const { data } = notification;
    sendSubscriptionNotifications(
      ctx,
      app,
      notification,
      resource.UserId,
      resourceType,
      'delete',
      resourceId,
      {
        title: data && data.title ? data.title : resourceType,
        body: data && data.body ? data.body : `Deleted ${resource.id}`,
      },
    );
  }
}
