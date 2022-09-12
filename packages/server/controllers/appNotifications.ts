import { logger } from '@appsemble/node-utils';
import { SubscriptionResponse } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import { Context } from 'koa';

import { App, AppSubscription, ResourceSubscription } from '../models/index.js';
import { checkRole } from '../utils/checkRole.js';
import { sendNotification } from '../utils/sendNotification.js';

export async function getSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    query: { endpoint },
  } = ctx;

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
    throw notFound('App not found');
  }

  const [appSubscription] = app.AppSubscriptions;

  if (!appSubscription) {
    throw notFound('Subscription not found');
  }

  const resources: SubscriptionResponse = {};
  if (app.definition.resources) {
    for (const resource of Object.keys(app.definition.resources)) {
      resources[resource] = { create: false, update: false, delete: false };
    }
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

export async function addSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { endpoint, keys },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, { attributes: [], include: [AppSubscription] });

  if (!app) {
    throw notFound('App not found');
  }

  await AppSubscription.create({
    AppId: appId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    UserId: user ? user.id : null,
  });
}

export async function updateSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { action, endpoint, resource, resourceId, value },
    },
    user,
  } = ctx;

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
    throw notFound('App not found');
  }

  const [appSubscription] = app.AppSubscriptions;

  if (!appSubscription) {
    throw notFound('Subscription not found');
  }

  if (user?.id && !appSubscription.UserId) {
    await appSubscription.update({ UserId: user.id });
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

    await ResourceSubscription.create({
      AppSubscriptionId: appSubscription.id,
      type: resource,
      action,
      ...(resourceId && { ResourceId: resourceId }),
    });
    return;
  }

  // Toggle subscription
  await (resourceSubscription
    ? resourceSubscription.destroy()
    : ResourceSubscription.create({
        AppSubscriptionId: appSubscription.id,
        type: resource,
        action,
        ...(resourceId && { ResourceId: resourceId }),
      }));
}

export async function broadcast(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { body, title },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSubscription, attributes: ['id', 'auth', 'p256dh', 'endpoint'] }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.PushNotifications);

  // XXX: Replace with paginated requests
  logger.verbose(`Sending ${app.AppSubscriptions.length} notifications for app ${appId}`);

  for (const subscription of app.AppSubscriptions) {
    sendNotification(app, subscription, { title, body });
  }
}
