import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { User } from '../../../models/index.js';
import { Organization } from '../../../models/Organization.js';
import { OrganizationMember } from '../../../models/OrganizationMember.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;

describe('getOrganizationSubscriptionPrice', () => {
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
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should fetch the price of a subscription if the user has permissions', async () => {
    authorizeStudio();
    const response = await request.get(
      `/api/organizations/${organization.id}/subscription/price?subscriptionType=basic&period=month`,
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        basePrice: '5.00',
        totalPrice: '5.00',
        vatAmount: '0.00',
        vatPercentage: '0.00',
      },
    });
  });

  it('should not fetch subscription price if the user does not have manage subscriptions role.', async () => {
    const password = await hash('testpassword', 10);
    const unauthorizedUser = await User.create({
      password,
      name: 'User two',
      primaryEmail: 'email@test.com',
      timezone: 'Europe/Amsterdam',
    });
    authorizeStudio(unauthorizedUser);
    const response = await request.get(
      `/api/organizations/${organization.id}/subscription/price?subscriptionType=premium&period=month`,
    );

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        statusCode: 403,
        message: 'User is not a member of this organization.',
      },
    });
  });
});
