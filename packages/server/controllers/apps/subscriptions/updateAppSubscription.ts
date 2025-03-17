import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppSubscription, ResourceSubscription } from '../../../models/index.js';

export async function updateAppSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { action, endpoint, resource, resourceId, value },
    },
    user: appMember,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['id', 'AppMemberId'],
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

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  const [appSubscription] = app.AppSubscriptions;
  assertKoaCondition(!!appSubscription, ctx, 404, 'Subscription not found');

  if (appMember?.id && !appSubscription.AppMemberId) {
    await appSubscription.update({ AppMemberId: appMember.id });
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
