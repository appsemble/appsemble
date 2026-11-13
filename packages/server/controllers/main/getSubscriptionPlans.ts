import { getSubscriptionPlanByName, SubscriptionPlanType } from '@appsemble/types';
import { type Context } from 'koa';

function toJsonLimit(limit: number | 'unlimited'): number | 'unlimited' {
  return limit === Number.POSITIVE_INFINITY ? 'unlimited' : limit;
}

export function getSubscriptionPlans(ctx: Context): void {
  ctx.body = Object.values(SubscriptionPlanType)
    .map(getSubscriptionPlanByName)
    .map((plan) => ({
      ...plan,
      appLimit: toJsonLimit(plan.appLimit),
      dailyNotifications: toJsonLimit(plan.dailyNotifications),
    }));
  ctx.set('Cache-Control', 'public,max-age=300');
}
