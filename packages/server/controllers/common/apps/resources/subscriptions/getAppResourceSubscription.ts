import { assertKoaCondition, getResourceDefinition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';

export async function getAppResourceSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    query: { endpoint },
  } = ctx;
  const { AppSubscription, Resource, ResourceSubscription } = await getAppDB(appId);
  const app = await App.findByPk(appId, { attributes: ['definition'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const appResource = await Resource.findByPk(resourceId, { attributes: ['id'] });

  const appSubscriptions = await AppSubscription.findAll({
    attributes: ['id'],
    include: [
      {
        model: ResourceSubscription,
        where: { type: resourceType, ResourceId: resourceId },
        required: false,
      },
    ],
    where: { endpoint },
  });

  getResourceDefinition(app.definition, resourceType, ctx);

  assertKoaCondition(appResource != null, ctx, 404, 'Resource not found.');

  const subscriptions = appSubscriptions[0]?.ResourceSubscriptions ?? [];
  const result: any = { id: resourceId, update: false, delete: false };

  for (const { action } of subscriptions) {
    if (!action) {
      continue;
    }
    result[action] = true;
  }

  ctx.body = result;
}
