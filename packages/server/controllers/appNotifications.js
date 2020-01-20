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
    Object.keys(app.definition.resources).forEach(resource => {
      resources[resource] = { create: false, update: false, delete: false };
    });
  }

  ctx.body = appSubscription.ResourceSubscriptions.reduce((acc, { type, action }) => {
    if (!acc[type]) {
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
  const { endpoint, resource, action, value } = ctx.request.body;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['id', 'UserId'],
        model: AppSubscription,
        include: [
          { model: ResourceSubscription, where: { type: resource, action }, required: false },
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

  if (!value) {
    const [resourceSubscription] = appSubscription.ResourceSubscriptions;
    if (!resourceSubscription) {
      return;
    }

    await resourceSubscription.destroy();
  } else {
    await appSubscription.createResourceSubscription({ type: resource, action });
  }
}

export async function broadcast(ctx) {
  const { appId } = ctx.params;
  const { App, AppSubscription } = ctx.db.models;
  const { title, body } = ctx.request.body;

  const app = await App.findByPk(appId, {
    include: [AppSubscription],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, permissions.PushNotifications);

  // XXX: Replace with paginated requests
  logger.verbose(`Sending ${app.AppSubscriptions.length} notifications for app ${app.id}`);
  app.AppSubscriptions.forEach(subscription => {
    sendNotification(ctx, app, subscription, { title, body });
  });
}
