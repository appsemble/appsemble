import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { OrganizationSubscription } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function getOrganizationOrganizationSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const subscription = await OrganizationSubscription.findOne({
    where: { OrganizationId: organizationId },
  });

  assertKoaError(!subscription, ctx, 404, 'Subscription not found.');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.QueryOrganizationSubscriptions],
  });

  ctx.body = {
    id: subscription!.id,
    cancelled: subscription!.cancelled,
    cancellationReason: subscription!.cancellationReason,
    expirationDate: subscription!.expirationDate,
    subscriptionPlan: subscription!.subscriptionPlan,
    organizationId: subscription!.OrganizationId,
    renewalPeriod: subscription!.renewalPeriod,
  };
}
