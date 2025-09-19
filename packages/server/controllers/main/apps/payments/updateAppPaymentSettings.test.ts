import { createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization, OrganizationMember } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let member: OrganizationMember;
let app: App;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('updateAppPaymentSettings', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    const user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    member = await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    app = await App.create(
      {
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        successUrl: 'testSuccessUrl',
        cancelUrl: 'testCancelUrl',
        OrganizationId: organization.id,
        visibility: 'public',
      },
      { raw: true },
    );
  });

  it('should update payment settings for an app', async () => {
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/payment`,
      createFormData({
        stripeApiSecretKey: 'newKey',
        stripeWebhookSecret: 'newSecret',
        successUrl: 'newSuccessUrl',
        cancelUrl: 'newCancelUrl',
      }),
    );
    expect(response.data).toStrictEqual({
      successUrl: 'newSuccessUrl',
      cancelUrl: 'newCancelUrl',
      stripeApiSecretKey: true,
      stripeWebhookSecret: true,
      enablePayments: true,
    });
  });

  it('should remove payment settings for an app', async () => {
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/payment`,
      createFormData({
        stripeApiSecretKey: 'newKey',
        stripeWebhookSecret: 'newSecret',
        successUrl: 'newSuccessUrl',
        cancelUrl: 'newCancelUrl',
        enablePayments: false,
      }),
    );
    expect(response.data).toStrictEqual({
      successUrl: null,
      cancelUrl: null,
      stripeApiSecretKey: false,
      stripeWebhookSecret: false,
      enablePayments: false,
    });
  });

  it('should not update settings if the user does not have permissions', async () => {
    await member.update({ role: PredefinedOrganizationRole.Member });
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/payment`,
      createFormData({
        stripeApiSecretKey: 'newKey',
        stripeWebhookSecret: 'newSecret',
        successUrl: 'newSuccessUrl',
        cancelUrl: 'newCancelUrl',
      }),
    );
    expect(response.data).toStrictEqual({
      error: 'Forbidden',
      message: 'User does not have sufficient organization permissions.',
      statusCode: 403,
    });
  });
});
