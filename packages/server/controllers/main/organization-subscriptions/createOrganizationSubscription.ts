import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';

import { Organization, OrganizationSubscription } from '../../../models/index.js';

export async function createOrganizationSubscription(ctx: Context): Promise<void> {
  const {
    request: {
      body: { cancelled, organizationId, status, subscriptionPlan },
    },
  } = ctx;

  const organizationExists = await Organization.count({ where: { id: organizationId } });
  assertKoaError(!organizationExists, ctx, 403, 'Invalid organization id.');

  try {
    const subscription = await OrganizationSubscription.create({
      status,
      cancelled,
      expirationDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      subscriptionPlan,
      organizationId,
    });

    ctx.body = {
      id: subscription.id,
      cancelled: subscription.cancelled,
      expirationDate: subscription.expirationDate,
      subscriptionPlan: subscription.subscriptionPlan,
      organizationId: subscription.OrganizationId,
    };
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(
        ctx,
        409,
        `A subscription already exists for organization "${organizationId}".`,
      );
    }
    throw error;
  }
}
