import { assertKoaCondition, getResourceDefinition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';

export async function getAppResourceTypeSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    query: { endpoint },
  } = ctx;
  const { AppSubscription, Resource, ResourceSubscription } = await getAppDB(appId);
  const app = await App.findByPk(appId, { attributes: ['definition'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const appResource = await Resource.findOne({ attributes: ['id'], where: { type: resourceType } });

  const appSubscriptions = await AppSubscription.findAll({
    attributes: ['id'],
    include: [
      {
        model: ResourceSubscription,
        where: { type: resourceType },
        required: false,
      },
    ],
    where: { endpoint },
  });

  getResourceDefinition(app.definition, resourceType, ctx);

  assertKoaCondition(appResource != null, ctx, 404, 'Resource not found');
  assertKoaCondition(
    appSubscriptions.length > 0,
    ctx,
    404,
    'App member is not subscribed to this app.',
  );

  const [appSubscription] = appSubscriptions;

  assertKoaCondition(appSubscription != null, ctx, 404, 'Subscription not found');

  const result: any = { create: false, update: false, delete: false };
  for (const { ResourceId, action } of appSubscription.ResourceSubscriptions) {
    if (!action) {
      continue;
    }
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
