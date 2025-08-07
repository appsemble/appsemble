import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { getSubscriptionPlanByName } from '@appsemble/types';
import { type Context } from 'koa';

import { App, OrganizationSubscription } from '../models/index.js';

/**
 * Check if the app is currently locked.
 *
 * Will throw a 403 error if the app is locked.
 *
 * @param ctx The Koa context that can contain a force flag in its body
 * @param app The app to check against
 * @param visibility Optional parameter when app visibility is being updated
 * @returns boolean Whether the app is public
 */
export async function checkAppLimit(
  ctx: Context,
  app: Partial<App>,
  visibility?: string,
): Promise<void> {
  if ((app.visibility === 'public' && !visibility) || (app.visibility !== 'public' && visibility)) {
    const subscription = await OrganizationSubscription.findOne({
      where: { OrganizationId: app.OrganizationId },
    });
    assertKoaCondition(subscription != null, ctx, 404, 'Subscription not found');
    const subscriptionPlan = getSubscriptionPlanByName(String(subscription!.subscriptionPlan!));
    const appList = await App.findAll({
      where: { OrganizationId: app.OrganizationId },
    });
    const appCount = appList.filter((currentApp) => currentApp.visibility === 'public').length;

    if (appCount >= subscriptionPlan.appLimit) {
      throwKoaError(ctx, 403, 'App limit reached.');
    }
  }
}
