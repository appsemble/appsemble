import { permissions, SchemaValidationError, validate } from '@appsemble/utils';
import Boom from '@hapi/boom';
import parseOData from '@wesselkuipers/odata-sequelize';
import crypto from 'crypto';
import { Op } from 'sequelize';

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

function generateQuery(ctx, { updatedHash, createdHash }) {
  if (ctx.querystring) {
    try {
      return parseOData(
        decodeURIComponent(
          ctx.querystring
            .replace(/\+/g, '%20')
            .replace(/\$updated/g, updatedHash)
            .replace(/\$created/g, createdHash),
        ),
        ctx.db,
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
const deepRename = (object, keys, { updatedHash, createdHash }) => {
  if (!object) {
    return {};
  }

  const isArray = Array.isArray(object);
  const obj = isArray ? [...object] : { ...object };

  const entries = [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
  entries.forEach(key => {
    const value = obj[key];

    if (isArray) {
      if (keys.some(k => k === value)) {
        obj[key] = `data.${value}`;
      }
    } else if (keys.some(k => k === key)) {
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
  const { App, AppSubscription, ResourceSubscription, User } = ctx.db.models;
  const { appId } = ctx.params;
  const roles = notification.to.filter(n => n !== '$author');
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
          attributes: [],
          where: { type: resourceType, action },
        },
      ],
    });

    subscriptions.push(
      ...resourceSubscribers.filter(
        resourceSub =>
          (resourceSub.ResourceId && resourceId === resourceSub.ResourceId) ||
          resourceSub.ResourceId == null,
      ),
    );
  }

  subscriptions.forEach(subscription => {
    sendNotification(ctx, app, subscription, options);
  });
}

export async function queryResources(ctx) {
  const updatedHash = `updated${crypto.randomBytes(5).toString('hex')}`;
  const createdHash = `created${crypto.randomBytes(5).toString('hex')}`;

  const query = generateQuery(ctx, { updatedHash, createdHash });
  const { appId, resourceType } = ctx.params;
  const { App, User } = ctx.db.models;

  const app = await App.findByPk(appId);
  const { properties } = verifyResourceDefinition(app, resourceType);

  const keys = Object.keys(properties);
  // the data is stored in the ´data´ column as json
  const renamedQuery = deepRename(query, keys, { updatedHash, createdHash });

  try {
    const resources = await app.getResources({
      ...renamedQuery,
      where: { ...renamedQuery.where, type: resourceType },
      include: [{ model: User, attributes: ['id', 'name'], required: false }],
    });

    ctx.body = resources.map(resource => ({
      id: resource.id,
      ...resource.data,
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
  const { appId, resourceType, resourceId } = ctx.params;
  const { App, User } = ctx.db.models;

  const app = await App.findByPk(appId);
  verifyResourceDefinition(app, resourceType);

  const [resource] = await app.getResources({
    where: { id: resourceId, type: resourceType },
    include: [{ model: User, attributes: ['name'], required: false }],
    raw: true,
  });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  ctx.body = {
    id: resource.id,
    ...resource.data,
    $created: resource.created,
    $updated: resource.updated,
    ...(resource.UserId != null && {
      $author: { id: resource.UserId, name: resource['User.name'] },
    }),
  };
}

export async function createResource(ctx) {
  const { appId, resourceType } = ctx.params;
  const { App } = ctx.db.models;
  const { user } = ctx.state;

  const app = await App.findByPk(appId);
  verifyResourceDefinition(app, resourceType);

  const resource = ctx.request.body;
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

  const { id, created, updated } = await app.createResource({
    type: resourceType,
    data: resource,
    UserId: user && user.id,
  });

  const resourceDefinition = app.definition.resources[resourceType];

  if (
    resourceDefinition.create &&
    resourceDefinition.create.hooks &&
    resourceDefinition.create.hooks.notification
  ) {
    sendSubscriptionNotifications(
      ctx,
      app,
      resourceDefinition.create.hooks.notification,
      null,
      resourceType,
      'create',
      id,
      {
        title: resourceType,
        body: 'Created new',
      },
    );
  }

  ctx.body = { id, ...resource, $created: created, $updated: updated };
  ctx.status = 201;
}

export async function updateResource(ctx) {
  const { appId, resourceType, resourceId } = ctx.params;
  const { App, Resource } = ctx.db.models;

  const app = await App.findByPk(appId);

  verifyResourceDefinition(app, resourceType);
  let resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId },
  });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  const updatedResource = ctx.request.body;
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
    id: resourceId,
    ...resource.get('data', { plain: true }),
    $created: resource.created,
    $updated: resource.updated,
  };

  const resourceDefinition = app.definition.resources[resourceType];
  if (
    resourceDefinition.update &&
    resourceDefinition.update.hooks &&
    resourceDefinition.update.hooks.notification
  ) {
    sendSubscriptionNotifications(
      ctx,
      app,
      resourceDefinition.update.hooks.notification,
      null,
      resourceType,
      'update',
      resourceId,
      {
        title: resourceType,
        body: `Updated ${resource.id}`,
      },
    );
  }
}

export async function deleteResource(ctx) {
  const { appId, resourceType, resourceId } = ctx.params;
  const { App, Resource } = ctx.db.models;

  const app = await App.findByPk(appId);

  await checkRole(ctx, app.OrganizationId, permissions.ManageResources);

  verifyResourceDefinition(app, resourceType);
  const resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId },
  });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  await resource.destroy();
  ctx.status = 204;

  const resourceDefinition = app.definition.resources[resourceType];
  if (
    resourceDefinition.delete &&
    resourceDefinition.delete.hooks &&
    resourceDefinition.delete.hooks.notification
  ) {
    sendSubscriptionNotifications(
      ctx,
      app,
      resourceDefinition.delete.hooks.notification,
      resource.UserId,
      resourceType,
      'delete',
      resourceId,
      {
        title: resourceType,
        body: `Deleted ${resource.id}`,
      },
    );
  }
}
