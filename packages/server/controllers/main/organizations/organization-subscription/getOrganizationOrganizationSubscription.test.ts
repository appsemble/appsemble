import { PredefinedOrganizationRole, SubscriptionPlanType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { User } from '../../../../models/index.js';
import { Organization } from '../../../../models/Organization.js';
import { OrganizationMember } from '../../../../models/OrganizationMember.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;

describe('getOrganizationSubscription', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
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
      role: PredefinedOrganizationRole.Member,
    });
  });

  it('should fetch an organizationSubscription if the user has permissions', async () => {
    authorizeStudio();
    const response = await request.get(`/api/organizations/${organization.id}/subscription`);

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: 1,
        cancelled: true,
        expirationDate: null,
        subscriptionPlan: SubscriptionPlanType.Free,
        organizationId: 'testorganization',
        renewalPeriod: null,
      },
    });
  });

  it('should not fetch an organizationSubscription if the user is not part of the organization', async () => {
    const password = await hash('testpassword', 10);
    const unauthorizedUser = await User.create({
      password,
      name: 'User two',
      primaryEmail: 'email@test.com',
      timezone: 'Europe/Amsterdam',
    });
    authorizeStudio(unauthorizedUser);
    const response = await request.get('/api/organizations/test/subscription');

    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', statusCode: 404, message: 'Subscription not found.' },
    });
  });
});
