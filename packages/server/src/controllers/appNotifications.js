import { logger } from '@appsemble/node-utils';
import { permissions } from '@appsemble/utils';
import Boom from '@hapi/boom';

import checkRole from '../utils/checkRole';
import sendNotification from '../utils/sendNotification';

export async function getSubscription(ctx) {
  const { appId } = ctx.params;
  const { endpoint } = ctx.query;
  const { App, AppSubscription, ResourceSubscription } = ctx.db.models;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        attributes: ['id'],
        model: AppSubscription,
        include: [ResourceSubscription],
        required: false,
        where: { endpoint },
      },
    ],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const [appSubscription] = app.AppSubscriptions;

  if (!appSubscription) {
    throw Boom.notFound('Subscription not found');
  }

  const resources = {};
  if (app.definition.resources) {
    Object.keys(app.definition.resources).forEach((resource) => {
      resources[resource] = { create: false, update: false, delete: false };
    });
  }

  ctx.body = appSubscription.ResourceSubscriptions.reduce((acc, { ResourceId, action, type }) => {
    if (!acc[type]) {
      return acc;
    }

    if (ResourceId) {
      if (!acc[type].subscriptions) {
        acc[type].subscriptions = {};
      }

      if (!acc[type].subscriptions[ResourceId]) {
        acc[type].subscriptions[ResourceId] = { update: false, delete: false };
      }

      acc[type].subscriptions[ResourceId] = {
        ...acc[type].subscriptions[ResourceId],
        [action]: true,
      };

      return acc;
    }

    acc[type][action] = true;
    return acc;
  }, resources);
}

export async function addSubscription(ctx) {
  const { appId } = ctx.params;
  const { App, AppSubscription } = ctx.db.models;
  const { user } = ctx.state;
  const { endpoint, keys } = ctx.request.body;

  const app = await App.findByPk(appId, { include: [AppSubscription] });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  await app.createAppSubscription({
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    UserId: user ? user.id : null,
  });
}

export async function updateSubscription(ctx) {
  const { appId } = ctx.params;
  const { App, AppSubscription, ResourceSubscription } = ctx.db.models;
  const { user } = ctx.state;
  const { action, endpoint, resource, resourceId, value } = ctx.request.body;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['id', 'UserId'],
        model: AppSubscription,
        include: [
          {
            model: ResourceSubscription,
            where: {
              type: resource,
              action,
              ResourceId: resourceId === undefined ? null : resourceId,
            },
            required: false,
          },
        ],
        required: false,
        where: { endpoint },
      },
    ],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const [appSubscription] = app.AppSubscriptions;

  if (!appSubscription) {
    throw Boom.notFound('Subscription not found');
  }

  if (user && user.id && !appSubscription.UserId) {
    await appSubscription.setUser(user.id);
  }

  const [resourceSubscription] = appSubscription.ResourceSubscriptions;
  if (value !== undefined) {
    if (!value) {
      if (!resourceSubscription) {
        // Subscription didn’t exist in the first place, do nothing
        return;
      }

      // Remove the subscription
      await resourceSubscription.destroy();
      return;
    }

    if (resourceSubscription) {
      // Subscription already exists, do nothing
      return;
    }

    await appSubscription.createResourceSubscription({
      type: resource,
      action,
      ...(resourceId && { ResourceId: resourceId }),
    });
    return;
  }

  // Toggle subscription
  if (!resourceSubscription) {
    await appSubscription.createResourceSubscription({
      type: resource,
      action,
      ...(resourceId && { ResourceId: resourceId }),
    });
  } else {
    await resourceSubscription.destroy();
  }
}

export async function broadcast(ctx) {
  const { appId } = ctx.params;
  const { App, AppSubscription } = ctx.db.models;
  const { body, title } = ctx.request.body;

  const app = await App.findByPk(appId, {
    include: { model: AppSubscription, attributes: ['id', 'auth', 'p256dh', 'endpoint'] },
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, permissions.PushNotifications);

  // XXX: Replace with paginated requests
  logger.verbose(`Sending ${app.AppSubscriptions.length} notifications for app ${app.id}`);

  app.AppSubscriptions.forEach((subscription) => {
    sendNotification(ctx, app, subscription, { title, body });
  });
}
