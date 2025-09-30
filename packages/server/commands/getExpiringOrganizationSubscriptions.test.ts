import { SubscriptionPlanType } from '@appsemble/types';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { getExpiringOrganizationSubscriptions } from './getExpiringOrganizationSubscriptions.js';
import { Organization, OrganizationSubscription } from '../models/index.js';

describe('getExpiringOrganizationSubscriptions', () => {
  const date = dayjs().add(1, 'day');
  let subscription: OrganizationSubscription;

  beforeEach(async () => {
    await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });

    subscription = (await OrganizationSubscription.findOne({
      where: { OrganizationId: 'testorganization' },
    }))!;
    await subscription.update({
      expirationDate: String(date),
    });
  });

  it('should fetch an organizationSubscription', async () => {
    await subscription.update({ cancelled: false });
    const response = await getExpiringOrganizationSubscriptions(1);

    expect(response).toMatchObject([
      {
        id: 1,
        cancelled: false,
        cancelledAt: null,
        expirationDate: date.format('YYYY-MM-DD'),
        created: expect.any(Date),
        subscriptionPlan: SubscriptionPlanType.Free,
        OrganizationId: 'testorganization',
        renewalPeriod: null,
        cancellationReason: null,
        updated: expect.any(Date),
      },
    ]);
  });

  it('should not fetch cancelled organizationSubscriptions.', async () => {
    const response = await getExpiringOrganizationSubscriptions(1);

    expect(response).toMatchObject([]);
  });

  it('should not fetch any organizationSubscriptions.', async () => {
    const response = await getExpiringOrganizationSubscriptions(0);

    expect(response).toMatchObject([]);
  });
});
