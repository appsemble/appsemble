import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { OrganizationSubscription } from '../../../models/OrganizationSubscription.js';

export async function deleteOrganizationSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationSubscriptionId },
  } = ctx;

  const subscription = await OrganizationSubscription.findByPk(organizationSubscriptionId);

  assertKoaError(!subscription, ctx, 404, 'Subscription not found.');

  await subscription!.destroy();

  ctx.body = {
    id: subscription!.id,
  };
}
