import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppSubscription, ResourceSubscription } from '../../../../models/index.js';

export async function updateAppSubscription(ctx: Context): Promise<void> {
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

  assertKoaError(!app, ctx, 404, 'App not found');

  const [appSubscription] = app.AppSubscriptions;
  assertKoaError(!appSubscription, ctx, 404, 'Subscription not found');

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
