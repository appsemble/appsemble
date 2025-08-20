import { type App as AppType, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization, OrganizationMember, type User } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { getPaymentObject } from '../../../utils/payments/getPaymentObject.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
let app: App;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'appsemble' };

describe('createAppCheckout', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer();
    await setTestApp(server);
    vi.mock('../../../utils/payments/getPaymentObject.js', () => {
      const paymentsMock = {
        createAppCheckout: vi.fn(() => Promise.resolve(null)),
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

    app = await App.create(
      {
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        stripeApiKey: 'key',
        stripeSecret: 'secret',
        successUrl: 'testSuccessUrl',
        cancelUrl: 'testCancelUrl',
        OrganizationId: organization.id,
        visibility: 'public',
      },
      { raw: true },
    );
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should create a checkout session for an app', async () => {
    authorizeStudio();
    const createAppCheckout = vi.fn().mockResolvedValue({
      checkout: { paymentUrl: 'testUrl' },
    });
    vi.mocked(getPaymentObject).mockResolvedValue({
      createOrUpdateCustomer: vi.fn(() => Promise.resolve(null)),
      createInvoice: vi.fn(() => Promise.resolve(null)),
      chargeInvoice: vi.fn(() => Promise.resolve(null)),
      deletePaymentMethods: vi.fn(() => Promise.resolve(null)),
      createAppCheckout,
    });
    await request.post<AppType>(`/api/apps/${app.id}/createCheckout?price=price_id`);
    expect(createAppCheckout).toHaveBeenCalledWith('price_id', 'testSuccessUrl', 'testCancelUrl');
  });

  it('should not create a checkout session for an app when missing payment information', async () => {
    authorizeStudio();
    const createAppCheckout = vi.fn().mockResolvedValue({
      checkout: { paymentUrl: 'testUrl' },
    });
    vi.mocked(getPaymentObject).mockResolvedValue({
      createOrUpdateCustomer: vi.fn(() => Promise.resolve(null)),
      createInvoice: vi.fn(() => Promise.resolve(null)),
      chargeInvoice: vi.fn(() => Promise.resolve(null)),
      deletePaymentMethods: vi.fn(() => Promise.resolve(null)),
      createAppCheckout,
    });
    await app.update({ successUrl: null });
    await request.post<AppType>(`/api/apps/${app.id}/createCheckout?price=price_id`);
    expect(createAppCheckout).not.toHaveBeenCalled();
  });

  it('should not create a checkout session for an app when appId is not found in the database', async () => {
    authorizeStudio();
    const createAppCheckout = vi.fn().mockResolvedValue({
      checkout: { paymentUrl: 'testUrl' },
    });
    vi.mocked(getPaymentObject).mockResolvedValue({
      createOrUpdateCustomer: vi.fn(() => Promise.resolve(null)),
      createInvoice: vi.fn(() => Promise.resolve(null)),
      chargeInvoice: vi.fn(() => Promise.resolve(null)),
      deletePaymentMethods: vi.fn(() => Promise.resolve(null)),
      createAppCheckout,
    });
    await app.update({ successUrl: null });
    await request.post<AppType>('/api/apps/2/createCheckout?price=price_id');
    expect(createAppCheckout).not.toHaveBeenCalled();
  });
});
