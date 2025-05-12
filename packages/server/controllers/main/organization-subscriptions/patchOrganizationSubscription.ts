import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission, PaymentProvider } from '@appsemble/types';
import { type Context } from 'koa';

import { Organization, OrganizationSubscription } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { getPaymentObject } from '../../../utils/payments/getPaymentObject.js';

export async function patchOrganizationSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationSubscriptionId },
    request: {
      body: { cancellationReason, cancelled, renewalPeriod },
    },
  } = ctx;

  const subscription = await OrganizationSubscription.findByPk(organizationSubscriptionId);

  assertKoaError(!subscription, ctx, 404, 'Subscription not found.');

  const organization = await Organization.findByPk(subscription!.OrganizationId);

  assertKoaError(!organization, ctx, 404, 'Organization not found.');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: subscription!.OrganizationId!,
    requiredPermissions: [OrganizationPermission.ManageOrganizationSubscriptions],
  });

  const payments = getPaymentObject(PaymentProvider.Stripe);
  const result: Partial<OrganizationSubscription> = {};

  if (cancelled !== undefined) {
    result.cancelled = cancelled;
    result.cancelledAt = new Date();
    payments.deletePaymentMethods(organization!.stripeCustomerId);
  }

  if (renewalPeriod !== undefined) {
    result.renewalPeriod = renewalPeriod;
  }

  if (renewalPeriod !== undefined) {
    result.renewalPeriod = renewalPeriod;
  }

  if (renewalPeriod !== undefined) {
    result.renewalPeriod = renewalPeriod;
  }

  if (cancellationReason !== undefined) {
    result.cancellationReason = cancellationReason || null;
  }

  const updated = await subscription!.update(result);

  ctx.body = {
    id: updated.id,
    cancelled: updated.cancelled,
    cancellationReason: updated.cancellationReason,
    cancelledAt: updated.cancelledAt,
    expirationDate: updated.expirationDate,
    subscriptionPlan: updated.subscriptionPlan,
    organizationId: updated.OrganizationId,
    renewalPeriod: updated.renewalPeriod,
  };
}
