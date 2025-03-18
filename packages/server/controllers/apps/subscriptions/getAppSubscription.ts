import { assertKoaCondition } from '@appsemble/node-utils';
import { type SubscriptionResponse } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppSubscription, ResourceSubscription } from '../../../models/index.js';

export async function getAppSubscription(ctx: Context): Promise<void> {
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
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const [appSubscription] = app.AppSubscriptions;
  assertKoaCondition(appSubscription != null, ctx, 404, 'Subscription not found');

  const resources: SubscriptionResponse = {};
  if (app.definition.resources) {
    for (const resource of Object.keys(app.definition.resources)) {
      resources[resource] = { create: false, update: false, delete: false };
    }
  }

  for (const { ResourceId, action, type } of appSubscription.ResourceSubscriptions) {
    if (!resources[type]) {
      continue;
    }

    if (ResourceId) {
      if (!resources[type].subscriptions) {
        resources[type].subscriptions = {};
      }

      if (!resources[type].subscriptions[ResourceId]) {
        resources[type].subscriptions[ResourceId] = { update: false, delete: false };
      }

      resources[type].subscriptions[ResourceId][action] = true;
    } else {
      resources[type][action] = true;
    }
  }
  ctx.body = resources;
}
