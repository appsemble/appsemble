import { assertKoaCondition, getResourceDefinition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  App,
  AppSubscription,
  Resource,
  ResourceSubscription,
} from '../../../../../models/index.js';

export async function getAppResourceTypeSubscription(ctx: Context): Promise<void> {
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
        attributes: ['id'],
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
  getResourceDefinition(app.definition, resourceType, ctx);

  assertKoaCondition(!!app.Resources.length, ctx, 404, 'Resource not found');
  assertKoaCondition(
    !!app.AppSubscriptions.length,
    ctx,
    404,
    'App member is not subscribed to this app.',
  );

  const [appSubscription] = app.AppSubscriptions;

  assertKoaCondition(!!appSubscription, ctx, 404, 'Subscription not found');

  const result: any = { create: false, update: false, delete: false };
  for (const { ResourceId, action } of appSubscription.ResourceSubscriptions) {
    if (ResourceId) {
      if (!result.subscriptions) {
        result.subscriptions = {};
      }

      if (!result.subscriptions[ResourceId]) {
        result.subscriptions[ResourceId] = { update: false, delete: false };
      }

      result.subscriptions[ResourceId][action] = true;
    } else {
      result[action] = true;
    }
  }

  ctx.body = result;
}
