import { createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole, SubscriptionPlanType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Organization, OrganizationMember, type User } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;

describe('cancelOrganizationSubscription', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
    vi.mock('../../../utils/payments/getPaymentObject.js', () => {
      const paymentsMock = {
        deletePaymentMethods: vi.fn(() => Promise.resolve()),
      };
      return { getPaymentObject: vi.fn(() => paymentsMock) };
    });
  });

  beforeEach(async () => {
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should cancel an organizationSubscription if the user is the owner', async () => {
    authorizeStudio();
    const response = await request.patch(
      '/api/organization-subscriptions/1',
      createFormData({
        cancelled: true,
        cancellationReason: 'test',
      }),
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: 1,
        cancelled: true,
        cancellationReason: 'test',
        cancelledAt: expect.any(String),
        expirationDate: null,
        renewalPeriod: null,
        subscriptionPlan: SubscriptionPlanType.Free,
        organizationId: 'testorganization',
      },
    });
  });
});
