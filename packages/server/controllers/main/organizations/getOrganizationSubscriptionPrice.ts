import { assertKoaError } from '@appsemble/node-utils';
import { getSubscriptionPlanByName, OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Organization, OrganizationSubscription } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { calculateSubscriptionPrice } from '../../../utils/calculateVat.js';

export async function getOrganizationSubscriptionPrice(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    queryParams: { couponCode, period, subscriptionType },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.ManageOrganizationSubscriptions],
  });

  const subscriptionPlan = getSubscriptionPlanByName(subscriptionType);
  assertKoaError(!subscriptionPlan, ctx, 404, 'Subscription plan not found.');

  const organization = await Organization.findByPk(organizationId);
  assertKoaError(!organization, ctx, 404, 'Organization not found.');

  const currentSubscription = await OrganizationSubscription.findOne({
    where: { OrganizationId: organizationId },
  });
  assertKoaError(!currentSubscription, ctx, 404, 'Subscription not found.');

  const pricingInfo = await calculateSubscriptionPrice(
    subscriptionPlan,
    currentSubscription!,
    period,
    organization!.countryCode!,
    organization!.vatIdNumber,
    couponCode,
  );

  ctx.body = {
    totalPrice: pricingInfo?.totalPrice,
    basePrice: pricingInfo?.basePrice,
    activeSubscriptionDiscount: pricingInfo?.activeSubscriptionDiscount,
    vatPercentage: pricingInfo?.vatPercentage,
    vatAmount: pricingInfo?.vatAmount,
    couponDiscount: pricingInfo?.couponDiscount,
    priceWithCoupon: pricingInfo?.priceWithCoupon,
  };
}
